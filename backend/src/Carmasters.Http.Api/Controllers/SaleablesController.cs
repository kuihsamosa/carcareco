using System;
using System.Linq;
using Carmasters.Core.Application.RateLimiting;
using Dapper;
using Microsoft.AspNetCore.Mvc;
using NHibernate;

namespace Carmasters.Http.Api.Controllers
{
    /// <summary>
    /// Autosuggest source for the work/invoice line-item editor. Returns spare
    /// parts from inventory PLUS the names of services & products used on past
    /// works — so services auto-populate from history, not just inventory.
    /// Shape matches the editor combobox: { code, name, price }.
    /// </summary>
    [TenantRateLimit]
    [Route("api/[controller]")]
    [ApiController]
    public class SaleablesController : ControllerBase
    {
        private readonly ISession session;

        public SaleablesController(ISession session)
        {
            this.session = session;
        }

        [HttpGet("page")]
        public IActionResult GetPage(string searchText, int limit = 20)
        {
            if (string.IsNullOrWhiteSpace(searchText))
                return Ok(new { items = Array.Empty<object>(), hasMore = false });

            var q = "%" + searchText.Trim() + "%";

            // ord=1 inventory parts (authoritative price), ord=2 past line items.
            // DISTINCT ON collapses duplicate names, preferring inventory.
            var sql = @"
                SELECT code, name, price FROM (
                    SELECT DISTINCT ON (lower(name)) code, name, price, ord FROM (
                        SELECT sp.code, sp.name, sp.price, 1 AS ord
                        FROM domain.sparepart sp
                        WHERE concat_ws(' ', sp.code, sp.name) ILIKE @q
                        UNION ALL
                        SELECT code, name, price, 2 AS ord FROM (
                            SELECT DISTINCT ON (lower(s.name))
                                   COALESCE(pi.code, po.code, '') AS code, s.name, s.price
                            FROM domain.saleable s
                            LEFT JOIN domain.productinstalled pi ON pi.id = s.id
                            LEFT JOIN domain.productoffered  po ON po.id = s.id
                            WHERE s.name ILIKE @q AND COALESCE(s.name, '') <> ''
                            ORDER BY lower(s.name)
                        ) hist
                    ) u
                    ORDER BY lower(name), ord
                ) d
                ORDER BY ord, name
                LIMIT @limit";

            var rows = session.Connection.Query(sql, new { q, limit }).ToList();
            var items = rows.Select(r => new
            {
                code = (string)(r.code ?? ""),
                name = (string)(r.name ?? ""),
                price = (decimal?)r.price,
            }).ToArray();

            return Ok(new { items, hasMore = false });
        }
    }
}
