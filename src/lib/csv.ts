export type CsvSeparator = "," | ";";

export function toCsv(rows: string[][], options?: { separator?: CsvSeparator }): string {
  const separator = options?.separator ?? ",";
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  return rows.map((r) => r.map(escape).join(separator)).join("\r\n");
}

export function downloadCsv(filename: string, csv: string, options?: { bom?: boolean }): void {
  const payload = options?.bom ? `\uFEFF${csv}` : csv;
  const blob = new Blob([payload], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
