using Dapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Carmasters.Core.Application.RateLimiting;
using Carmasters.Core.Domain;
using System;
using System.Linq;

namespace Carmasters.Http.Api.Controllers
{
    [TenantRateLimit]
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class SalesController : ControllerBase
    {
        private readonly IRepository repository;

        public SalesController(IRepository repository)
        {
            this.repository = repository;
        }

        [HttpGet("years")]
        public IActionResult GetYears()
        {
            var years = repository.GetConnection().Query<int>(@"
                SELECT DISTINCT EXTRACT(YEAR FROM ip.issuedon)::int AS year
                FROM domain.invoice i
                INNER JOIN domain.pricing ip ON ip.id = i.id
                WHERE EXTRACT(YEAR FROM ip.issuedon) > 2000
                ORDER BY year DESC")
                .ToArray();
            return Ok(years);
        }

        [HttpGet("summary")]
        public IActionResult GetSummary([FromQuery] int year, [FromQuery] int? month)
        {
            string periodSelect, periodGroup, periodOrder;

            if (month.HasValue && month.Value > 0)
            {
                periodSelect = "EXTRACT(DAY FROM ip.issuedon)::int AS period, TO_CHAR(ip.issuedon,'DD') AS label";
                periodGroup  = "EXTRACT(DAY FROM ip.issuedon)::int, TO_CHAR(ip.issuedon,'DD')";
                periodOrder  = "EXTRACT(DAY FROM ip.issuedon)::int";
            }
            else
            {
                periodSelect = "EXTRACT(MONTH FROM ip.issuedon)::int AS period, TO_CHAR(ip.issuedon,'Mon') AS label";
                periodGroup  = "EXTRACT(MONTH FROM ip.issuedon)::int, TO_CHAR(ip.issuedon,'Mon')";
                periodOrder  = "EXTRACT(MONTH FROM ip.issuedon)::int";
            }

            var whereMonth = month.HasValue && month.Value > 0
                ? $"AND EXTRACT(MONTH FROM ip.issuedon) = {month.Value}"
                : "";

            var sql = $@"
                SELECT
                    {periodSelect},
                    COUNT(i.id)::int            AS invoicecount,
                    COALESCE(SUM(pl.total),0)   AS totalbilled,
                    COALESCE(SUM(CASE WHEN i.ispaid     THEN pl.total ELSE 0 END),0) AS totalpaid,
                    COALESCE(SUM(CASE WHEN NOT i.ispaid THEN pl.total ELSE 0 END),0) AS totaloutstanding
                FROM domain.invoice i
                INNER JOIN domain.pricing ip ON ip.id = i.id
                INNER JOIN (
                    SELECT pricingid, SUM(total) AS total
                    FROM domain.pricingline GROUP BY pricingid
                ) pl ON pl.pricingid = i.id
                WHERE EXTRACT(YEAR FROM ip.issuedon) = {year}
                {whereMonth}
                GROUP BY {periodGroup}
                ORDER BY {periodOrder}";

            var rows = repository.GetConnection().Query(sql).Select(r => new {
                period           = (int)r.period,
                label            = (string)r.label,
                invoiceCount     = (int)r.invoicecount,
                totalBilled      = (double)r.totalbilled,
                totalPaid        = (double)r.totalpaid,
                totalOutstanding = (double)r.totaloutstanding,
            });

            return Ok(rows);
        }

        [HttpGet("totals")]
        public IActionResult GetTotals([FromQuery] int year, [FromQuery] int? month)
        {
            var whereMonth = month.HasValue && month.Value > 0
                ? $"AND EXTRACT(MONTH FROM ip.issuedon) = {month.Value}"
                : "";

            var sql = $@"
                SELECT
                    COUNT(i.id)::int            AS invoicecount,
                    COALESCE(SUM(pl.total),0)   AS totalbilled,
                    COALESCE(SUM(CASE WHEN i.ispaid     THEN pl.total ELSE 0 END),0) AS totalpaid,
                    COALESCE(SUM(CASE WHEN NOT i.ispaid THEN pl.total ELSE 0 END),0) AS totaloutstanding
                FROM domain.invoice i
                INNER JOIN domain.pricing ip ON ip.id = i.id
                INNER JOIN (
                    SELECT pricingid, SUM(total) AS total
                    FROM domain.pricingline GROUP BY pricingid
                ) pl ON pl.pricingid = i.id
                WHERE EXTRACT(YEAR FROM ip.issuedon) = {year}
                {whereMonth}";

            var row = repository.GetConnection().QueryFirst(sql);
            return Ok(new {
                invoiceCount     = (int)row.invoicecount,
                totalBilled      = (double)row.totalbilled,
                totalPaid        = (double)row.totalpaid,
                totalOutstanding = (double)row.totaloutstanding,
            });
        }

        [HttpGet("invoices")]
        public IActionResult GetInvoices([FromQuery] int year, [FromQuery] int month, [FromQuery] int day)
        {
            var sql = $@"
                SELECT
                    w.id            AS workid,
                    i.number        AS invoicenumber,
                    ip.issuedon     AS issuedon,
                    COALESCE(ip.partyname, '')  AS customername,
                    COALESCE(ip.vehicleline1,'') AS vehicleline,
                    i.ispaid        AS ispaid,
                    COALESCE(pl.total, 0)       AS total
                FROM domain.invoice i
                INNER JOIN domain.pricing ip ON ip.id = i.id
                INNER JOIN domain.work w ON w.invoiceid = i.id
                INNER JOIN (
                    SELECT pricingid, SUM(total) AS total
                    FROM domain.pricingline GROUP BY pricingid
                ) pl ON pl.pricingid = i.id
                WHERE EXTRACT(YEAR  FROM ip.issuedon) = {year}
                  AND EXTRACT(MONTH FROM ip.issuedon) = {month}
                  AND EXTRACT(DAY   FROM ip.issuedon) = {day}
                ORDER BY i.number";

            var rows = repository.GetConnection().Query(sql).Select(r => new {
                workId        = (Guid)r.workid,
                invoiceNumber = (int)r.invoicenumber,
                issuedOn      = (DateTime)r.issuedon,
                customerName  = (string)r.customername,
                vehicleLine   = (string)r.vehicleline,
                isPaid        = (bool)r.ispaid,
                total         = (double)r.total,
            });

            return Ok(rows);
        }

        [HttpPatch("invoices/{workId}/togglepaid")]
        public IActionResult TogglePaid(Guid workId)
        {
            var sql = @"
                UPDATE domain.invoice
                SET ispaid = NOT ispaid
                WHERE id = (SELECT invoiceid FROM domain.work WHERE id = @workId)
                RETURNING ispaid";

            var isPaid = repository.GetConnection().QueryFirst<bool>(sql, new { workId });
            return Ok(new { isPaid });
        }
    }
}
