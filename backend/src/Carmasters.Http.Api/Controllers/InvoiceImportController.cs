using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Carmasters.Core.Application.Extensions;
using Carmasters.Core.Application.RateLimiting;
using Carmasters.Http.Api.Invoices;
using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using NHibernate;

namespace Carmasters.Http.Api.Controllers
{
    [TenantRateLimit]
    [Authorize(Policy = "ServerSidePolicy")]
    [Route("api/invoices")]
    [ApiController]
    public class InvoiceImportController : ControllerBase
    {
        private readonly NHibernate.ISession session;

        public InvoiceImportController(NHibernate.ISession session)
        {
            this.session = session;
        }

        /// <summary>
        /// Hard-deletes an invoice and the work order it hangs off, so the invoice
        /// number is free again and a re-import will not report it as a duplicate.
        ///
        /// This deliberately does NOT go through NHibernate: Work maps its Invoice with
        /// Cascade.SaveUpdate only, so deleting a Work leaves the invoice/pricing/pricingline
        /// rows behind — the number would stay taken by a row nothing links to. The raw
        /// deletes below run inside the ambient request transaction (UnitOfWorkAspect), so
        /// the whole batch commits or rolls back together.
        ///
        /// Clients and vehicles are left alone on purpose: they are shared records that
        /// other invoices and works may still point at.
        /// </summary>
        [HttpDelete]
        public async Task<IActionResult> Delete([FromBody] Guid[] ids)
        {
            if (ids == null || ids.Length == 0)
                return BadRequest(new { error = "No invoices selected." });

            var conn = session.Connection;
            var deleted = 0;

            foreach (var workId in ids)
            {
                var pricingId = await conn.QueryFirstOrDefaultAsync<Guid?>(
                    "SELECT invoiceid FROM domain.work WHERE id = @workId", new { workId });

                // Saleables are joined-subclass rows (productinstalled / serviceperformed /
                // productoffered / serviceoffered all key off domain.saleable). Grab the ids
                // before the subclass rows go, otherwise the parent rows are unreachable.
                var saleableIds = (await conn.QueryAsync<Guid>(
                    @"SELECT id FROM domain.productinstalled WHERE repairjobid IN (SELECT id FROM domain.repairjob WHERE workid = @workId)
                      UNION SELECT id FROM domain.serviceperformed WHERE repairjobid IN (SELECT id FROM domain.repairjob WHERE workid = @workId)
                      UNION SELECT id FROM domain.productoffered  WHERE offerid     IN (SELECT id FROM domain.offer     WHERE workid = @workId)
                      UNION SELECT id FROM domain.serviceoffered  WHERE offerid     IN (SELECT id FROM domain.offer     WHERE workid = @workId)",
                    new { workId })).ToList();

                var estimateIds = (await conn.QueryAsync<Guid>(
                    "SELECT estimateid FROM domain.offer WHERE workid = @workId AND estimateid IS NOT NULL",
                    new { workId })).ToList();

                // productinstalled.serviceid -> serviceperformed and productoffered.serviceid
                // -> serviceoffered, so the product rows have to go first.
                await conn.ExecuteAsync(
                    "DELETE FROM domain.productinstalled WHERE repairjobid IN (SELECT id FROM domain.repairjob WHERE workid = @workId)", new { workId });
                await conn.ExecuteAsync(
                    "DELETE FROM domain.serviceperformed WHERE repairjobid IN (SELECT id FROM domain.repairjob WHERE workid = @workId)", new { workId });
                await conn.ExecuteAsync(
                    "DELETE FROM domain.productoffered WHERE offerid IN (SELECT id FROM domain.offer WHERE workid = @workId)", new { workId });
                await conn.ExecuteAsync(
                    "DELETE FROM domain.serviceoffered WHERE offerid IN (SELECT id FROM domain.offer WHERE workid = @workId)", new { workId });

                if (saleableIds.Count > 0)
                    await conn.ExecuteAsync("DELETE FROM domain.saleable WHERE id = ANY(@saleableIds)", new { saleableIds });

                await conn.ExecuteAsync("DELETE FROM domain.repairjob WHERE workid = @workId", new { workId });
                await conn.ExecuteAsync("DELETE FROM domain.offer WHERE workid = @workId", new { workId });
                await conn.ExecuteAsync("DELETE FROM domain.assignment WHERE workid = @workId", new { workId });

                // work.invoiceid FKs the invoice, so drop the work before its pricing rows.
                var workRows = await conn.ExecuteAsync("DELETE FROM domain.work WHERE id = @workId", new { workId });

                if (estimateIds.Count > 0)
                {
                    await conn.ExecuteAsync("DELETE FROM domain.pricingline WHERE pricingid = ANY(@estimateIds)", new { estimateIds });
                    await conn.ExecuteAsync("DELETE FROM domain.estimate WHERE id = ANY(@estimateIds)", new { estimateIds });
                    await conn.ExecuteAsync("DELETE FROM domain.pricing WHERE id = ANY(@estimateIds)", new { estimateIds });
                }

                if (pricingId.HasValue)
                {
                    await conn.ExecuteAsync("DELETE FROM domain.pricingline WHERE pricingid = @pricingId", new { pricingId });
                    await conn.ExecuteAsync("DELETE FROM domain.invoice WHERE id = @pricingId", new { pricingId });
                    await conn.ExecuteAsync("DELETE FROM domain.pricing WHERE id = @pricingId", new { pricingId });
                }

                if (workRows > 0) deleted++;
            }

            return Ok(new { deleted });
        }

        [HttpPost("import")]
        [RequestSizeLimit(50_000_000)]
        public async Task<IActionResult> Import([FromForm] List<IFormFile> files, [FromQuery] bool dryRun = true)
        {
            if (files == null || files.Count == 0)
                return BadRequest(new { error = "No files uploaded." });

            var employeeId = this.EmployeeId();
            if (employeeId == null)
                return Unauthorized();

            var conn = session.Connection;

            var existingInvoiceNumbers = (await conn.QueryAsync<int>("SELECT number FROM domain.invoice"))
                .ToHashSet();
            var existingWorkNumbers = (await conn.QueryAsync<int>("SELECT number FROM domain.work"))
                .ToHashSet();
            var nextWorkNumber = existingWorkNumbers.Count > 0 ? existingWorkNumbers.Max() + 1 : 1;

            var results = new List<ImportedInvoiceResult>();
            var created = 0;
            var skipped = 0;
            var failed = 0;
            var rowOffset = 0;

            foreach (var file in files)
            {
                var shortName = Path.GetFileName(file.FileName);

                // Excel leaves "~$1234.xlsx" lock files next to open workbooks. They are
                // not workbooks at all, so skip them quietly instead of reporting a scary
                // parse failure for what is really just folder noise.
                if (shortName.StartsWith("~$", StringComparison.Ordinal))
                {
                    results.Add(new ImportedInvoiceResult
                    {
                        FileName = shortName,
                        Status = "skipped",
                        Reason = "Excel lock file, not an invoice"
                    });
                    skipped++;
                    continue;
                }

                if (!file.FileName.EndsWith(".xlsx", StringComparison.OrdinalIgnoreCase))
                {
                    results.Add(new ImportedInvoiceResult
                    {
                        FileName = file.FileName,
                        Status = "failed",
                        Reason = "Not an .xlsx file"
                    });
                    failed++;
                    continue;
                }

                List<ParsedInvoice> parsed;
                try
                {
                    using var stream = new MemoryStream();
                    await file.CopyToAsync(stream);
                    stream.Position = 0;
                    parsed = InvoiceWorkbookParser.ParseWorkbook(stream, file.FileName);
                }
                catch (Exception ex)
                {
                    results.Add(new ImportedInvoiceResult
                    {
                        FileName = file.FileName,
                        Status = "failed",
                        Reason = $"Parse error: {ex.Message}"
                    });
                    failed++;
                    continue;
                }

                foreach (var inv in parsed)
                {
                    if (inv.InvoiceNumber.HasValue && existingInvoiceNumbers.Contains(inv.InvoiceNumber.Value))
                    {
                        results.Add(new ImportedInvoiceResult
                        {
                            FileName = file.FileName,
                            InvoiceNumber = inv.InvoiceNumber,
                            Date = inv.Date?.ToString("yyyy-MM-dd"),
                            Customer = inv.Customer,
                            Plate = inv.LicensePlate,
                            Total = inv.TotalAmount,
                            LineCount = inv.Items.Count,
                            Status = "skipped",
                            Reason = "Duplicate invoice number"
                        });
                        skipped++;
                        continue;
                    }

                    var result = new ImportedInvoiceResult
                    {
                        FileName = file.FileName,
                        InvoiceNumber = inv.InvoiceNumber,
                        Date = inv.Date?.ToString("yyyy-MM-dd"),
                        Customer = inv.Customer,
                        Plate = inv.LicensePlate,
                        Total = inv.TotalAmount,
                        LineCount = inv.Items.Count,
                        Warnings = inv.Warnings
                    };

                    if (dryRun)
                    {
                        result.Status = "preview";
                        results.Add(result);
                        continue;
                    }

                    var savepointName = $"inv_{rowOffset}";
                    try
                    {
                        await conn.ExecuteAsync($"SAVEPOINT {savepointName}");

                        var workNumber = inv.InvoiceNumber ?? nextWorkNumber;
                        while (existingWorkNumbers.Contains(workNumber))
                            workNumber = nextWorkNumber++;
                        existingWorkNumbers.Add(workNumber);
                        nextWorkNumber = Math.Max(nextWorkNumber, workNumber + 1);

                        await InsertInvoice(conn, inv, employeeId.Value, workNumber, rowOffset);
                        rowOffset++;

                        if (inv.InvoiceNumber.HasValue)
                            existingInvoiceNumbers.Add(inv.InvoiceNumber.Value);

                        await conn.ExecuteAsync($"RELEASE SAVEPOINT {savepointName}");
                        result.Status = "created";
                        created++;
                    }
                    catch (Exception ex)
                    {
                        await conn.ExecuteAsync($"ROLLBACK TO SAVEPOINT {savepointName}");
                        result.Status = "failed";
                        result.Reason = ex.Message;
                        failed++;
                    }

                    results.Add(result);
                }
            }

            return Ok(new
            {
                dryRun,
                summary = new { created, skipped, failed, total = results.Count },
                results
            });
        }

        private async Task InsertInvoice(System.Data.IDbConnection conn, ParsedInvoice inv, Guid employeeId, int workNumber, int rowOffset)
        {
            var issuedOn = inv.Date ?? DateTime.UtcNow;
            var invoiceNumber = inv.InvoiceNumber ?? workNumber;
            var changedOn = DateTime.UtcNow.AddTicks(rowOffset);

            Guid? clientId = null;
            if (!string.IsNullOrWhiteSpace(inv.Customer))
            {
                var existing = await conn.QueryFirstOrDefaultAsync<Guid?>(
                    "SELECT id FROM domain.legalclient WHERE lower(name) = lower(@name) LIMIT 1",
                    new { name = inv.Customer });

                if (existing.HasValue)
                {
                    clientId = existing.Value;
                }
                else
                {
                    clientId = Guid.NewGuid();
                    await conn.ExecuteAsync(
                        "INSERT INTO domain.client (id, introducedat) VALUES (@id, @now)",
                        new { id = clientId, now = DateTime.UtcNow });
                    await conn.ExecuteAsync(
                        "INSERT INTO domain.legalclient (id, name) VALUES (@id, @name)",
                        new { id = clientId, name = inv.Customer[..Math.Min(inv.Customer.Length, 255)] });
                }
            }

            Guid? vehicleId = null;
            if (!string.IsNullOrWhiteSpace(inv.LicensePlate))
            {
                var existing = await conn.QueryFirstOrDefaultAsync<Guid?>(
                    "SELECT id FROM domain.vehicle WHERE upper(regnr) = upper(@plate) LIMIT 1",
                    new { plate = inv.LicensePlate });

                if (existing.HasValue)
                {
                    vehicleId = existing.Value;
                }
                else
                {
                    vehicleId = Guid.NewGuid();
                    await conn.ExecuteAsync(
                        "INSERT INTO domain.vehicle (id, producer, model, regnr, odo, introducedat) VALUES (@id, NULL, @model, @plate, @km, @now)",
                        new { id = vehicleId, model = inv.VehicleModel, plate = inv.LicensePlate, km = inv.Kilometers, now = DateTime.UtcNow });
                }

                if (clientId.HasValue)
                {
                    await conn.ExecuteAsync(
                        "INSERT INTO domain.vehicleregistration (ownerid, vehicleid, datetimefrom) VALUES (@oid, @vid, @from) ON CONFLICT DO NOTHING",
                        new { oid = clientId, vid = vehicleId, from = issuedOn });
                }
            }

            var workId = Guid.NewGuid();
            await conn.ExecuteAsync(
                @"INSERT INTO domain.work (id, number, clientid, vehicleid, startedon, changedon, starterid, odo, userstatus, completedon, completerid)
                  VALUES (@id, @number, @clientId, @vehicleId, @startedOn, @changedOn, @starterId, @odo, 'Default', @completedOn, @completerId)",
                new
                {
                    id = workId,
                    number = workNumber,
                    clientId,
                    vehicleId,
                    startedOn = issuedOn,
                    changedOn,
                    starterId = employeeId,
                    odo = inv.Kilometers,
                    completedOn = issuedOn,
                    completerId = employeeId
                });

            var pricingId = Guid.NewGuid();
            var partyName = inv.Customer ?? "Unknown";
            var vehicleLine = $"{inv.VehicleModel ?? ""} {inv.LicensePlate ?? ""}".Trim();

            await conn.ExecuteAsync(
                "INSERT INTO domain.pricing (id, partyname, vehicleline1, issuedon, issuerid) VALUES (@id, @party, @vl, @issued, @issuer)",
                new { id = pricingId, party = partyName[..Math.Min(partyName.Length, 255)], vl = string.IsNullOrEmpty(vehicleLine) ? (string)null : vehicleLine, issued = issuedOn, issuer = employeeId });

            await conn.ExecuteAsync(
                "INSERT INTO domain.invoice (id, number, paymenttype, duedays, ispaid) VALUES (@id, @num, 0, 0, true)",
                new { id = pricingId, num = invoiceNumber });

            await conn.ExecuteAsync(
                "UPDATE domain.work SET invoiceid = @invId WHERE id = @wId",
                new { invId = pricingId, wId = workId });

            var items = inv.Items;
            if (items.Count > 0)
            {
                for (var i = 0; i < items.Count; i++)
                {
                    var item = items[i];
                    var desc = string.IsNullOrWhiteSpace(item.Description) ? "(imported item)" : item.Description;
                    var amt = item.Amount ?? (item.Quantity ?? 1) * (item.UnitPrice ?? 0);
                    await conn.ExecuteAsync(
                        @"INSERT INTO domain.pricingline (pricingid, nr, description, quantity, unitprice, unit, discount, total, totalwithvat)
                          VALUES (@pid, @nr, @desc, @qty, @price, 'pcs', 0, @total, @totalVat)",
                        new { pid = pricingId, nr = (short)(i + 1), desc = desc[..Math.Min(desc.Length, 500)], qty = item.Quantity ?? 1m, price = item.UnitPrice ?? amt, total = amt, totalVat = amt });
                }
            }
            else if (inv.TotalAmount.HasValue && inv.TotalAmount > 0)
            {
                await conn.ExecuteAsync(
                    @"INSERT INTO domain.pricingline (pricingid, nr, description, quantity, unitprice, unit, discount, total, totalwithvat)
                      VALUES (@pid, 1, 'Workshop Services', 1, @price, 'job', 0, @total, @totalVat)",
                    new { pid = pricingId, price = inv.TotalAmount, total = inv.TotalAmount, totalVat = inv.TotalAmount });
            }

            var rjId = Guid.NewGuid();
            await conn.ExecuteAsync(
                "INSERT INTO domain.repairjob (id, workid, ordernr, startedon, starterid) VALUES (@id, @wid, 1, @started, @starter)",
                new { id = rjId, wid = workId, started = issuedOn, starter = employeeId });

            foreach (var item in items)
            {
                var salName = string.IsNullOrWhiteSpace(item.Description) ? "(imported item)" : item.Description;
                var salId = Guid.NewGuid();
                await conn.ExecuteAsync(
                    "INSERT INTO domain.saleable (id, name, quantity, unit, price) VALUES (@id, @name, @qty, 'pcs', @price)",
                    new { id = salId, name = salName[..Math.Min(salName.Length, 255)], qty = item.Quantity ?? 1m, price = item.UnitPrice ?? 0m });
                await conn.ExecuteAsync(
                    "INSERT INTO domain.serviceperformed (id, repairjobid, mechanicid) VALUES (@id, @rjid, @mid)",
                    new { id = salId, rjid = rjId, mid = employeeId });
            }
        }

        private class ImportedInvoiceResult
        {
            public string FileName { get; set; }
            public int? InvoiceNumber { get; set; }
            public string Date { get; set; }
            public string Customer { get; set; }
            public string Plate { get; set; }
            public decimal? Total { get; set; }
            public int LineCount { get; set; }
            public string Status { get; set; }
            public string Reason { get; set; }
            public List<string> Warnings { get; set; }
        }
    }
}
