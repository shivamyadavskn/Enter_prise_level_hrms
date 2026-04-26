import xlsx from "xlsx";

/**
 * Streams an XLSX workbook to the Express response.
 *
 * @param {Response} res
 * @param {string}   filename   - Without extension
 * @param {Array<{name: string, rows: Array<Object>}>} sheets
 */
export function streamWorkbook(res, filename, sheets) {
  const wb = xlsx.utils.book_new();
  for (const sheet of sheets) {
    const ws = xlsx.utils.json_to_sheet(sheet.rows || []);
    // Auto column widths (best-effort)
    const cols = Object.keys(sheet.rows?.[0] || {}).map((k) => ({
      wch: Math.min(40, Math.max(k.length, ...sheet.rows.map((r) => String(r[k] ?? "").length))) + 2,
    }));
    ws["!cols"] = cols;
    xlsx.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31)); // Excel sheet name 31 char limit
  }

  const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}.xlsx"`);
  res.setHeader("Content-Length", buffer.length);
  res.send(buffer);
}

// ── Date formatting helper for export rows ──────────────────────────
export const fmtDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");
export const fmtNum  = (n) => (n == null ? "" : Number(n));
