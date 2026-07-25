using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Carmasters.Core.Application.Extensions;
using Carmasters.Core.Application.RateLimiting;
using ClosedXML.Excel;
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
                    parsed = ParseWorkbook(stream, file.FileName);
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

        private List<ParsedInvoice> ParseWorkbook(MemoryStream stream, string fileName)
        {
            var invoices = new List<ParsedInvoice>();

            using var workbook = new XLWorkbook(stream);
            var sheet = workbook.Worksheets.First();
            var rows = sheet.RowsUsed().ToList();
            if (rows.Count == 0) return invoices;

            var inv = new ParsedInvoice
            {
                SourceFile = fileName,
                Warnings = new List<string>()
            };

            var allValues = new List<List<string>>();
            foreach (var row in rows)
            {
                var cells = new List<string>();
                foreach (var cell in row.CellsUsed())
                {
                    cells.Add(cell.GetFormattedString());
                }
                allValues.Add(cells);
            }

            foreach (var rowCells in allValues)
            {
                foreach (var cellValue in rowCells)
                {
                    var upper = cellValue.Trim().ToUpperInvariant();

                    if (upper.Contains("MODEL") && cellValue.Contains(':'))
                        inv.VehicleModel = ExtractFieldValue(cellValue);
                    else if ((upper.Contains("N/ PLATE") || upper.Contains("PLATE")) && cellValue.Contains(':'))
                        inv.LicensePlate = CleanPlate(ExtractFieldValue(cellValue));
                    else if (upper.Contains("DATE") && cellValue.Contains(':'))
                        inv.Date = ParseDate(ExtractFieldValue(cellValue));
                    else if (upper.Contains("KM") && cellValue.Contains(':'))
                    {
                        var kmVal = ExtractFieldValue(cellValue);
                        if (kmVal != null && int.TryParse(kmVal.Replace(",", "").Replace(" ", ""), out var km))
                            inv.Kilometers = km;
                    }
                    else if ((upper.Contains("NAME & ADD") || upper.Contains("TO:")) && cellValue.Contains(':'))
                        inv.Customer = ExtractFieldValue(cellValue);
                    else if (upper.Contains("INVOICE") && cellValue.Contains(':'))
                    {
                        var numStr = ExtractFieldValue(cellValue);
                        if (numStr != null && int.TryParse(numStr.Trim(), out var num))
                            inv.InvoiceNumber = num;
                    }
                }
            }

            if (inv.InvoiceNumber == null)
            {
                var match = Regex.Match(fileName, @"\d+");
                if (match.Success && int.TryParse(match.Value, out var fileNum))
                    inv.InvoiceNumber = fileNum;
            }

            var itemsStarted = false;
            foreach (var row in rows)
            {
                var rowStr = string.Join(" ", row.CellsUsed().Select(c => c.GetFormattedString())).ToUpperInvariant();

                if (new[] { "SERVICE RENDERED", "DESCRIPTION", "UNIT RM", "AMOUNT" }.Any(k => rowStr.Contains(k)))
                {
                    itemsStarted = true;
                    continue;
                }

                if (rowStr.Contains("TOTAL"))
                {
                    foreach (var cell in row.CellsUsed())
                    {
                        if (TryParseDecimal(cell.GetFormattedString(), out var total) && total > 0)
                        {
                            inv.TotalAmount = total;
                            break;
                        }
                    }
                    continue;
                }

                if (itemsStarted)
                {
                    var cells = row.CellsUsed().Select(c => c.GetFormattedString().Trim()).ToList();
                    if (cells.Count < 2 || string.IsNullOrWhiteSpace(cells[0])) continue;

                    var item = ParseItemRow(cells);
                    if (item != null)
                        inv.Items.Add(item);
                }
            }

            invoices.Add(inv);
            return invoices;
        }

        private static ParsedItem ParseItemRow(List<string> cells)
        {
            var item = new ParsedItem();

            if (cells.Count > 0 && int.TryParse(cells[0], out _))
            {
                if (cells.Count > 1) item.Description = cells[1];
            }
            else
            {
                item.Description = cells[0];
            }

            var numerics = new List<decimal>();
            var startIdx = string.IsNullOrWhiteSpace(item.Description) ? 1 : 2;
            for (var i = startIdx; i < cells.Count; i++)
            {
                if (TryParseDecimal(cells[i], out var n) && n > 0)
                    numerics.Add(n);
            }

            if (numerics.Count == 1)
            {
                item.Amount = numerics[0];
            }
            else if (numerics.Count >= 2)
            {
                item.UnitPrice = numerics[^2];
                item.Amount = numerics[^1];
                if (numerics.Count >= 3)
                    item.Quantity = numerics[^3];
            }

            if (string.IsNullOrWhiteSpace(item.Description) && item.Amount == null)
                return null;

            return item;
        }

        private static string ExtractFieldValue(string cellValue)
        {
            if (string.IsNullOrWhiteSpace(cellValue)) return null;
            foreach (var delim in new[] { ':', '=', '-' })
            {
                var idx = cellValue.IndexOf(delim);
                if (idx >= 0)
                {
                    var val = cellValue[(idx + 1)..].Trim();
                    return string.IsNullOrEmpty(val) ? null : val;
                }
            }
            return null;
        }

        private static string CleanPlate(string s)
        {
            if (string.IsNullOrWhiteSpace(s)) return null;
            s = s.Trim().ToUpperInvariant();
            if (s.Length > 15) return null;
            var junk = new[] { "MODEL", "PLATE", "INVOICE", "LABOUR", "SERVICE", "NUMBER" };
            if (junk.Any(j => s.Contains(j))) return null;
            return s;
        }

        private static DateTime? ParseDate(string s)
        {
            if (string.IsNullOrWhiteSpace(s)) return null;
            var formats = new[] { "d/M/yy", "d/M/yyyy", "d-M-yy", "d-M-yyyy", "M/d/yy", "M/d/yyyy" };
            foreach (var fmt in formats)
            {
                if (DateTime.TryParseExact(s.Trim(), fmt, CultureInfo.InvariantCulture, DateTimeStyles.None, out var dt))
                    return dt;
            }
            return null;
        }

        private static bool TryParseDecimal(string s, out decimal result)
        {
            result = 0;
            if (string.IsNullOrWhiteSpace(s)) return false;
            return decimal.TryParse(s.Replace(",", "").Replace(" ", ""), NumberStyles.Any, CultureInfo.InvariantCulture, out result);
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

        private class ParsedInvoice
        {
            public string SourceFile { get; set; }
            public int? InvoiceNumber { get; set; }
            public DateTime? Date { get; set; }
            public string Customer { get; set; }
            public string VehicleModel { get; set; }
            public string LicensePlate { get; set; }
            public int? Kilometers { get; set; }
            public decimal? TotalAmount { get; set; }
            public List<ParsedItem> Items { get; set; } = new();
            public List<string> Warnings { get; set; } = new();
        }

        private class ParsedItem
        {
            public string Description { get; set; }
            public decimal? Quantity { get; set; }
            public decimal? UnitPrice { get; set; }
            public decimal? Amount { get; set; }
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
