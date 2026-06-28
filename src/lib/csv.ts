function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convert an array of plain objects to CSV and trigger a browser download.
 * Columns are the union of all keys (first row's order preferred).
 */
export function exportToCsv(filename: string, rows: Record<string, unknown>[]): void {
  if (rows.length === 0) {
    triggerDownload(filename, '');
    return;
  }

  const columns: string[] = [];
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!columns.includes(key)) columns.push(key);
    }
  }

  const header = columns.map(escapeCell).join(',');
  const body = rows
    .map((row) => columns.map((col) => escapeCell(row[col])).join(','))
    .join('\r\n');

  triggerDownload(filename, `${header}\r\n${body}`);
}

function triggerDownload(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
