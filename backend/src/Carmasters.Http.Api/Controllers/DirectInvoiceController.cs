using System;
using System.Linq;
using System.Threading.Tasks;
using Carmasters.Core.Application.Extensions;
using Carmasters.Core.Application.RateLimiting;
using Carmasters.Core.Application.Services;
using Carmasters.Core.Domain;
using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NHibernate;

namespace Carmasters.Http.Api.Controllers
{
    [TenantRateLimit]
    [Authorize(Policy = "ServerSidePolicy")]
    [Route("api/invoices")]
    [ApiController]
    public class DirectInvoiceController : ControllerBase
    {
        private readonly ISession session;
        private readonly ISequnceNumberProviderFactory numberProviderFactory;
        private readonly ITenantConfigService tenantConfigService;

        public DirectInvoiceController(ISession session, ISequnceNumberProviderFactory numberProviderFactory, ITenantConfigService tenantConfigService)
        {
            this.session = session;
            this.numberProviderFactory = numberProviderFactory;
            this.tenantConfigService = tenantConfigService;
        }

        [HttpPost("direct")]
        public async Task<IActionResult> Create([FromBody] DirectInvoiceRequest model)
        {
            var employeeId = this.EmployeeId();
            if (employeeId == null) return Unauthorized();

            var conn = session.Connection;
            var now = DateTime.UtcNow;

            var pricingOptions = await tenantConfigService.GetPricingAsync();
            var vatRate = pricingOptions.Invoice?.VatRate ?? 0;
            var dueDays = model.DueDays ?? (short)(pricingOptions.Invoice?.DueDays ?? 30);

            var workNumber = numberProviderFactory.GetNumberProvider<Work>().Next();
            var invoiceNumber = numberProviderFactory.GetNumberProvider<Invoice>().Next();

            var workId = Guid.NewGuid();
            var pricingId = Guid.NewGuid();
            var invoiceDate = model.InvoiceDate ?? now;

            await conn.ExecuteAsync(
                @"INSERT INTO domain.work (id, number, clientid, vehicleid, startedon, changedon, starterid, userstatus, completedon, completerid, is_direct)
                  VALUES (@id, @number, @clientId, NULL, @startedOn, @changedOn, @starterId, 'Default', @completedOn, @completerId, true)",
                new
                {
                    id = workId,
                    number = workNumber,
                    clientId = model.ClientId,
                    startedOn = invoiceDate,
                    changedOn = now,
                    starterId = employeeId.Value,
                    completedOn = invoiceDate,
                    completerId = employeeId.Value
                });

            await conn.ExecuteAsync(
                @"INSERT INTO domain.pricing (id, partyname, partyaddress, partycode, vehicleline1, vehicleline2, vehicleline3, vehicleline4, issuedon, issuerid)
                  VALUES (@id, @partyName, @partyAddress, @partyCode, @vl1, @vl2, @vl3, @vl4, @issuedOn, @issuerId)",
                new
                {
                    id = pricingId,
                    partyName = string.IsNullOrWhiteSpace(model.ClientName) ? (string)null : model.ClientName,
                    partyAddress = model.ClientAddress,
                    partyCode = model.ClientRegCode,
                    vl1 = model.VehicleLine1,
                    vl2 = model.VehicleLine2,
                    vl3 = model.VehicleLine3,
                    vl4 = model.VehicleLine4,
                    issuedOn = invoiceDate,
                    issuerId = employeeId.Value
                });

            await conn.ExecuteAsync(
                "INSERT INTO domain.invoice (id, number, paymenttype, duedays, ispaid, iscredited) VALUES (@id, @num, @paymentType, @dueDays, @isPaid, false)",
                new { id = pricingId, num = invoiceNumber, paymentType = (int)(model.IsPaid ? PaymentType.Cash : PaymentType.BankTransfer), dueDays, isPaid = model.IsPaid });

            await conn.ExecuteAsync(
                "UPDATE domain.work SET invoiceid = @invId WHERE id = @wId",
                new { invId = pricingId, wId = workId });

            if (model.Lines != null && model.Lines.Length > 0)
            {
                var taxMultiplier = 1 + vatRate / 100m;
                for (var i = 0; i < model.Lines.Length; i++)
                {
                    var line = model.Lines[i];
                    var qty = line.Quantity <= 0 ? 1m : line.Quantity;
                    var unitPrice = line.UnitPrice;
                    var discount = line.Discount;
                    var totalBeforeDiscount = qty * unitPrice;
                    var discountAmount = totalBeforeDiscount * discount / 100m;
                    var total = totalBeforeDiscount - discountAmount;
                    var totalWithVat = total * taxMultiplier;

                    await conn.ExecuteAsync(
                        @"INSERT INTO domain.pricingline (pricingid, nr, description, quantity, unitprice, unit, discount, total, totalwithvat)
                          VALUES (@pid, @nr, @desc, @qty, @price, @unit, @discount, @total, @totalVat)",
                        new
                        {
                            pid = pricingId,
                            nr = (short)(i + 1),
                            desc = line.Description ?? "",
                            qty,
                            price = unitPrice,
                            unit = string.IsNullOrWhiteSpace(line.Unit) ? "pcs" : line.Unit,
                            discount,
                            total,
                            totalVat = totalWithVat
                        });
                }
            }

            var rjId = Guid.NewGuid();
            await conn.ExecuteAsync(
                "INSERT INTO domain.repairjob (id, workid, ordernr, startedon, starterid) VALUES (@id, @wid, 1, @started, @starter)",
                new { id = rjId, wid = workId, started = invoiceDate, starter = employeeId.Value });

            if (model.Lines != null)
            {
                foreach (var line in model.Lines)
                {
                    var salId = Guid.NewGuid();
                    await conn.ExecuteAsync(
                        "INSERT INTO domain.saleable (id, name, quantity, unit, price) VALUES (@id, @name, @qty, @unit, @price)",
                        new { id = salId, name = (line.Description ?? "")[..Math.Min((line.Description ?? "").Length, 255)], qty = line.Quantity <= 0 ? 1m : line.Quantity, unit = string.IsNullOrWhiteSpace(line.Unit) ? "pcs" : line.Unit, price = line.UnitPrice });
                    await conn.ExecuteAsync(
                        "INSERT INTO domain.serviceperformed (id, repairjobid, mechanicid) VALUES (@id, @rjid, @mid)",
                        new { id = salId, rjid = rjId, mid = employeeId.Value });
                }
            }

            return Ok(new { workId, invoiceId = pricingId, invoiceNumber });
        }
    }

    public class DirectInvoiceRequest
    {
        public Guid? ClientId { get; set; }
        public string ClientName { get; set; }
        public string ClientAddress { get; set; }
        public string ClientRegCode { get; set; }
        public string VehicleLine1 { get; set; }
        public string VehicleLine2 { get; set; }
        public string VehicleLine3 { get; set; }
        public string VehicleLine4 { get; set; }
        public DateTime? InvoiceDate { get; set; }
        public bool IsPaid { get; set; } = true;
        public short? DueDays { get; set; }
        public DirectInvoiceLine[] Lines { get; set; }
    }

    public class DirectInvoiceLine
    {
        public string Description { get; set; }
        public decimal Quantity { get; set; } = 1;
        public string Unit { get; set; } = "pcs";
        public decimal UnitPrice { get; set; }
        public decimal Discount { get; set; }
    }
}
