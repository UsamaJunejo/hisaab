/** An Excel workbook (XML Spreadsheet 2003, opens in Excel) with several sheets. */
export function workbook(sheets: { name: string; rows: (string | number | null)[][] }[]): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const cell = (v: string | number | null) => (typeof v === "number" ? `<Cell><Data ss:Type="Number">${v}</Data></Cell>` : `<Cell><Data ss:Type="String">${esc(v ?? "")}</Data></Cell>`);
  return `<?xml version="1.0"?>\n<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Styles><Style ss:ID="h"><Font ss:Bold="1"/></Style></Styles>
${sheets.map((s) => `<Worksheet ss:Name="${esc(s.name)}"><Table>${s.rows.map((r, i) => `<Row${i === 0 ? ' ss:StyleID="h"' : ""}>${r.map(cell).join("")}</Row>`).join("")}</Table></Worksheet>`).join("\n")}
</Workbook>`;
}
