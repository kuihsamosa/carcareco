using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using ClosedXML.Excel;

namespace Carmasters.Http.Api.Invoices
{
    /// <summary>
    /// Reads a Miro Auto invoice workbook into a structured record.
    ///
    /// Deliberately free of ASP.NET / NHibernate dependencies so it can be exercised
    /// directly against the invoice archive without standing up the API.
    /// </summary>
    public static class InvoiceWorkbookParser
    {
        // ── Parsing ───────────────────────────────────────────────────────────
        //
        // Ported from parse_all_invoices.py (repo root), which is the parser that
        // produced the validated historical dataset. Two things it gets right that a
        // naive cell-by-cell scan does not:
        //
        //  1. Column positions are preserved. Cells must be read by column index, not
        //     by "cells that happen to be non-empty" — most invoices put the label in
        //     one cell ("MODEL:") and the value in the NEXT one ("MYVI"), so a
        //     compacted row loses the pairing and every header field comes back empty.
        //  2. There are two layout families, and they need different readers.
        //     Format B is the wide company-letterhead grid (fixed columns);
        //     Format A is the older narrow layout (label/value found by scanning).

        internal static readonly Regex NumberedRowB = new(@"^\d{1,3}$", RegexOptions.Compiled);
        internal static readonly Regex NumberedRowA = new(@"^\d{1,2}$", RegexOptions.Compiled);
        internal static readonly Regex NoHeaderCell = new(@"^NO:?$", RegexOptions.Compiled);
        internal static readonly Regex ItemHeaderText = new(@"SERVICE\s+RENDERED|DESCRIPTION", RegexOptions.Compiled);
        internal static readonly Regex ItemHeaderNo = new(@"\bNO\b|\bNO:", RegexOptions.Compiled);
        internal static readonly Regex LabelDate = new(@"\bDATE\b", RegexOptions.Compiled | RegexOptions.IgnoreCase);
        internal static readonly Regex LabelModel = new(@"\bMODEL\b", RegexOptions.Compiled | RegexOptions.IgnoreCase);
        internal static readonly Regex LabelPlate = new(@"N\s*/\s*PLATE", RegexOptions.Compiled | RegexOptions.IgnoreCase);
        internal static readonly Regex LabelKm = new(@"\bKM\b", RegexOptions.Compiled | RegexOptions.IgnoreCase);
        internal static readonly Regex LabelCustomer = new(@"NAME\s*[&A]?\s*ADD", RegexOptions.Compiled | RegexOptions.IgnoreCase);
        internal static readonly Regex PlateShape = new(@"^[A-Z0-9 ]+$", RegexOptions.Compiled);
        internal static readonly Regex DigitsOnly = new(@"^\d+$", RegexOptions.Compiled);
        internal static readonly Regex QtyWithUnit = new(@"^(\d+(?:\.\d+)?)\s*(L|pcs|unit|nos|pc)$", RegexOptions.Compiled | RegexOptions.IgnoreCase);
        internal static readonly Regex IsoDate = new(@"^\d{4}-\d{2}-\d{2}", RegexOptions.Compiled);
        internal static readonly Regex DmyDate = new(@"^(\d{1,2})[/\-](\d{1,2})[/\-](\d{2,4})$", RegexOptions.Compiled);
        internal static readonly Regex LeadingDigits = new(@"^(\d+)", RegexOptions.Compiled);

        // Rows that read like notes, recommendations or letterhead boilerplate rather
        // than billable lines. Taken verbatim from the Python script so this importer
        // produces the same shape of data as the existing records.
        internal static readonly string[] SkipDescriptionPrefixes =
        {
            "NOTE", "NEXT", "FOUND ", "* ", "BANK", "ACCOUNT", "AUTHORIS",
            "RECEIVED", "SIGNATURE", "DRIVE YOUR", "WARRANTY", "ALL PARTS",
            "EVALUATE", "TIRE PRESSURE", "ENGINE LEAK", "BATTERY",
            "ATF OIL", "ATF FILTER", "REAR ABSORBER", "ABSORBER SET",
            "ENGINE MOUNTING", "AUTO OIL", "TYRE", "CABIN FILTER"
        };

        public static List<ParsedInvoice> ParseWorkbook(Stream stream, string fileName)
        {
            using var workbook = new XLWorkbook(stream);
            var sheet = workbook.Worksheets.First();
            var rows = ReadRows(sheet);

            var inv = IsFormatB(rows) ? ParseFormatB(rows) : ParseFormatA(rows);
            inv.SourceFile = fileName;
            inv.InvoiceNumber = InvoiceNumberFromFileName(fileName) ?? inv.InvoiceNumber;

            if (inv.Date == null)
                inv.Warnings.Add("No date found — will be filed under today's date");
            if (string.IsNullOrWhiteSpace(inv.Customer))
                inv.Warnings.Add("No customer name found");
            if (string.IsNullOrWhiteSpace(inv.LicensePlate))
                inv.Warnings.Add("No licence plate found");
            if (inv.Items.Count == 0)
                inv.Warnings.Add(inv.TotalAmount.HasValue
                    ? "No line items read — will import as a single total-only line"
                    : "No line items and no total read");

            return new List<ParsedInvoice> { inv };
        }

        /// <summary>
        /// Reads the used range into a rectangular grid of strings. Empty cells are
        /// kept as "" so that a value's column index still lines up with its label's.
        /// </summary>
        internal static List<List<string>> ReadRows(IXLWorksheet sheet)
        {
            var rows = new List<List<string>>();
            var lastRow = sheet.LastRowUsed()?.RowNumber() ?? 0;
            var lastCol = sheet.LastColumnUsed()?.ColumnNumber() ?? 0;
            if (lastRow == 0 || lastCol == 0) return rows;

            for (var r = 1; r <= lastRow; r++)
            {
                var row = sheet.Row(r);
                var cells = new List<string>(lastCol);
                for (var c = 1; c <= lastCol; c++)
                    cells.Add(CellText(row.Cell(c)));
                rows.Add(cells);
            }
            return rows;
        }

        internal static string CellText(IXLCell cell)
        {
            if (cell == null || cell.IsEmpty()) return string.Empty;
            if (cell.DataType == XLDataType.DateTime)
            {
                try { return cell.GetDateTime().ToString("yyyy-MM-dd", CultureInfo.InvariantCulture); }
                catch { /* not really a date — fall through to the displayed text */ }
            }
            return (cell.GetFormattedString() ?? string.Empty).Trim();
        }

        internal static string At(List<string> row, int index) =>
            index >= 0 && index < row.Count ? row[index] : string.Empty;

        /// <summary>Wide letterhead layout: company header block, or "INVOICE NO" in column D.</summary>
        internal static bool IsFormatB(List<List<string>> rows)
        {
            foreach (var row in rows.Take(8))
            {
                foreach (var c in row)
                {
                    var u = c.ToUpperInvariant();
                    if (u.Contains("MIRO AUTO") && u.Contains("BLOCK D")) return true;
                }
                if (At(row, 3).ToUpperInvariant().Contains("INVOICE NO")) return true;
            }
            return false;
        }

        // Format B columns (0-based): B=1 label, C=2 value, D=3 label, E=4 value, F=5 total.
        internal static ParsedInvoice ParseFormatB(List<List<string>> rows)
        {
            var inv = new ParsedInvoice();
            var inItems = false;

            foreach (var row in rows)
            {
                var c1 = At(row, 1).Trim().ToUpperInvariant().TrimEnd(':');
                var c3 = At(row, 3).Trim().ToUpperInvariant().TrimEnd(':');

                if (c1 == "TO" && string.IsNullOrWhiteSpace(inv.Customer))
                    inv.Customer = NullIfBlank(At(row, 2).Trim());

                if (c3 == "DATE" && inv.Date == null)
                    inv.Date = ParseDateString(At(row, 4));

                if (c1 == "MODEL" && string.IsNullOrWhiteSpace(inv.VehicleModel))
                    inv.VehicleModel = NullIfBlank(At(row, 2).Trim());

                if ((c1 == "N/PLATE" || c1 == "N/ PLATE") && string.IsNullOrWhiteSpace(inv.LicensePlate))
                {
                    var plate = At(row, 2).Trim();
                    if (plate.Length > 0 && plate.Length <= 20)
                        inv.LicensePlate = plate.ToUpperInvariant();
                }

                if ((c3 == "MILLAGE" || c3 == "MILEAGE") && inv.Kilometers == null)
                {
                    var n = ParseNum(At(row, 4));
                    if (n is > 1000 and < 9999999) inv.Kilometers = (int)n.Value;
                }

                if (At(row, 4).Trim().ToUpperInvariant() == "TOTAL" && inv.TotalAmount == null)
                {
                    var n = ParseNum(At(row, 5));
                    if (n is > 0) inv.TotalAmount = n;
                }

                var headerLabel = At(row, 2).Trim().ToUpperInvariant();
                if (At(row, 1).Trim().ToUpperInvariant() == "NO" &&
                    (headerLabel == "DESCRIPTION" || headerLabel == "PARTS PRICE" ||
                     headerLabel == "PARTS" || headerLabel == "SERVICE RENDERED"))
                {
                    inItems = true;
                    continue;
                }

                if (!inItems) continue;

                if (!NumberedRowB.IsMatch(At(row, 1).Trim())) continue;

                // A blank or zero total means an unused template row, not a real line.
                var total = ParseNum(At(row, 5).Trim());
                if (total is null or 0) continue;

                var desc = At(row, 2).Trim();
                if (string.IsNullOrWhiteSpace(desc) || IsSkipDescription(desc)) continue;

                var qty = ParseNum(At(row, 3).Trim());
                if (qty is null or 0) qty = 1m;
                var unitPrice = ParseNum(At(row, 4).Trim());
                if (unitPrice is null or 0) unitPrice = Math.Abs(total.Value);

                inv.Items.Add(new ParsedItem
                {
                    Description = desc,
                    Quantity = qty,
                    UnitPrice = unitPrice,
                    Amount = total
                });
            }

            return inv;
        }

        // Narrow layout: a field may sit in one cell ("DATE : 19/4/22") or be split
        // across two ("DATE :" then "19/4/22"), so labels are located by scanning.
        internal static ParsedInvoice ParseFormatA(List<List<string>> rows)
        {
            var inv = new ParsedInvoice();
            var headerFound = false;
            var nrCol = 0;

            foreach (var row in rows)
            {
                var flat = string.Join(" ", row).ToUpperInvariant();

                if (!headerFound)
                {
                    if (inv.Date == null)
                        inv.Date = ParseDateString(FindValueInRow(row, LabelDate));

                    if (string.IsNullOrWhiteSpace(inv.VehicleModel))
                    {
                        var v = FindValueInRow(row, LabelModel);
                        if (v.Length > 0 && v.Length <= 40 && !DigitsOnly.IsMatch(v) &&
                            !v.ToUpperInvariant().Contains("MIRO AUTO") &&
                            !v.ToUpperInvariant().Contains("INVOICE"))
                            inv.VehicleModel = v.ToUpperInvariant();
                    }

                    if (string.IsNullOrWhiteSpace(inv.LicensePlate))
                    {
                        var v = FindValueInRow(row, LabelPlate);
                        if (v.Length > 0 && v.Length <= 20 && PlateShape.IsMatch(v.ToUpperInvariant()))
                            inv.LicensePlate = v.ToUpperInvariant();
                    }

                    if (inv.Kilometers == null)
                    {
                        var n = ParseNum(FindValueInRow(row, LabelKm));
                        if (n is > 1000 and < 9999999) inv.Kilometers = (int)n.Value;
                    }

                    if (string.IsNullOrWhiteSpace(inv.Customer))
                    {
                        var v = FindValueInRow(row, LabelCustomer);
                        if (v.Trim().Length > 2) inv.Customer = v.ToUpperInvariant();
                    }

                    if (flat.Contains("TOTAL") && inv.TotalAmount == null)
                    {
                        for (var i = row.Count - 1; i >= 0; i--)
                        {
                            var n = ParseNum(row[i]);
                            if (n is > 0) { inv.TotalAmount = n; break; }
                        }
                    }

                    if (ItemHeaderText.IsMatch(flat) && ItemHeaderNo.IsMatch(flat))
                    {
                        headerFound = true;
                        for (var i = 0; i < row.Count; i++)
                        {
                            if (NoHeaderCell.IsMatch(row[i].Trim().ToUpperInvariant())) { nrCol = i; break; }
                        }
                    }
                    continue;
                }

                if (row.Count <= nrCol) continue;

                if (!NumberedRowA.IsMatch(row[nrCol].Trim()))
                {
                    if (flat.Contains("TOTAL") && inv.TotalAmount == null)
                    {
                        for (var i = row.Count - 1; i >= 0; i--)
                        {
                            var n = ParseNum(row[i]);
                            if (n is > 0) { inv.TotalAmount = n; break; }
                        }
                    }
                    continue;
                }

                var rest = row.Skip(nrCol + 1).Where(c => !string.IsNullOrWhiteSpace(c)).ToList();
                if (rest.Count == 0) continue;

                var desc = rest.FirstOrDefault(c => ParseNum(c) == null) ?? rest[0];
                if (IsSkipDescription(desc)) continue;

                decimal? amount = null;
                for (var i = rest.Count - 1; i >= 0; i--)
                {
                    var n = ParseNum(rest[i]);
                    if (n is not null && n != 0) { amount = n; break; }
                }
                if (amount == null) continue;

                var nums = rest.Select(ParseNum).Where(n => n is not null && n != 0).Select(n => n.Value).ToList();
                var unitPrice = nums.Count >= 2 ? nums[^2] : amount.Value;

                var qty = 1m;
                foreach (var c in rest)
                {
                    if (c == desc) continue;
                    var m = QtyWithUnit.Match(c.Trim());
                    if (m.Success)
                    {
                        qty = decimal.Parse(m.Groups[1].Value, CultureInfo.InvariantCulture);
                        break;
                    }
                    var n = ParseNum(c);
                    // Only a small whole number that isn't the money columns reads as a count.
                    if (n is not null && n != 0 && n != amount && n != unitPrice &&
                        n >= 1 && n <= 50 && n == decimal.Truncate(n.Value))
                    {
                        qty = n.Value;
                        break;
                    }
                }

                inv.Items.Add(new ParsedItem
                {
                    Description = desc,
                    Quantity = qty,
                    UnitPrice = unitPrice,
                    Amount = amount
                });
            }

            return inv;
        }

        /// <summary>
        /// Finds a labelled value: either after the colon in the label's own cell, or
        /// in the next non-empty cell to its right.
        /// </summary>
        internal static string FindValueInRow(List<string> row, Regex label)
        {
            for (var i = 0; i < row.Count; i++)
            {
                if (string.IsNullOrEmpty(row[i]) || !label.IsMatch(row[i])) continue;

                var after = ExtractAfterColon(row[i]);
                if (!string.IsNullOrEmpty(after)) return after;

                for (var j = i + 1; j < row.Count; j++)
                    if (!string.IsNullOrWhiteSpace(row[j])) return row[j].Trim();
            }
            return string.Empty;
        }

        internal static string ExtractAfterColon(string s)
        {
            var idx = s.IndexOf(':');
            return idx >= 0 ? s[(idx + 1)..].Trim() : string.Empty;
        }

        internal static bool IsSkipDescription(string desc)
        {
            if (string.IsNullOrWhiteSpace(desc)) return true;
            var upper = desc.ToUpperInvariant();
            if (SkipDescriptionPrefixes.Any(p => upper.StartsWith(p, StringComparison.Ordinal))) return true;
            return desc.Length > 200;   // a long unpriced blob is a notes block
        }

        /// <summary>Invoice number from the file name: leading digits, ignoring a stray "xlsx" stem.</summary>
        internal static int? InvoiceNumberFromFileName(string fileName)
        {
            var stem = Path.GetFileNameWithoutExtension(fileName) ?? string.Empty;
            stem = Regex.Replace(stem, "xlsx$", string.Empty, RegexOptions.IgnoreCase).Trim();
            var m = LeadingDigits.Match(stem);
            return m.Success && int.TryParse(m.Groups[1].Value, out var n) ? n : (int?)null;
        }

        internal static DateTime? ParseDateString(string v)
        {
            if (string.IsNullOrWhiteSpace(v)) return null;
            v = v.Trim();

            var iso = IsoDate.Match(v);
            if (iso.Success && DateTime.TryParseExact(iso.Value, "yyyy-MM-dd",
                    CultureInfo.InvariantCulture, DateTimeStyles.None, out var isoDate))
                return isoDate;

            // Day-first — these are Malaysian workshop invoices.
            var m = DmyDate.Match(v);
            if (m.Success)
            {
                var d = int.Parse(m.Groups[1].Value, CultureInfo.InvariantCulture);
                var mo = int.Parse(m.Groups[2].Value, CultureInfo.InvariantCulture);
                var y = int.Parse(m.Groups[3].Value, CultureInfo.InvariantCulture);
                if (y < 100) y += 2000;
                try { return new DateTime(y, mo, d); }
                catch (ArgumentOutOfRangeException) { return null; }
            }
            return null;
        }

        internal static decimal? ParseNum(string s)
        {
            if (string.IsNullOrWhiteSpace(s)) return null;
            var t = s.Replace(",", string.Empty).Trim();
            return decimal.TryParse(t, NumberStyles.Float, CultureInfo.InvariantCulture, out var n)
                ? n
                : (decimal?)null;
        }

        internal static string NullIfBlank(string s) => string.IsNullOrWhiteSpace(s) ? null : s;

    }

        public class ParsedInvoice
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

        public class ParsedItem
        {
            public string Description { get; set; }
            public decimal? Quantity { get; set; }
            public decimal? UnitPrice { get; set; }
            public decimal? Amount { get; set; }
        }
}
