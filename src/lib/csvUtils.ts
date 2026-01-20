export type CsvValue = string | number | boolean | null | undefined;

export type CsvBuildOptions = {
  delimiter?: string;
  newline?: string;
};

const escapeCell = (value: CsvValue, delimiter: string): string => {
  if (value === null || value === undefined) return '';

  let text = String(value);

  const needsQuotes =
    text.includes('"') ||
    text.includes(delimiter) ||
    text.includes('\n') ||
    text.includes('\r') ||
    text.startsWith(' ') ||
    text.endsWith(' ');

  if (text.includes('"')) {
    text = text.replace(/"/g, '""');
  }

  return needsQuotes ? `"${text}"` : text;
};

export const buildCsv = (
  headers: string[],
  rows: CsvValue[][],
  options: CsvBuildOptions = {}
): string => {
  const delimiter = options.delimiter ?? ',';
  const newline = options.newline ?? '\n';

  const headerRow = headers.map((h) => escapeCell(h, delimiter)).join(delimiter);
  const bodyRows = rows.map((row) => row.map((cell) => escapeCell(cell, delimiter)).join(delimiter));

  return [headerRow, ...bodyRows].join(newline);
};

export type CsvDownloadOptions = {
  bom?: boolean;
  type?: string;
};

export const downloadCsv = (csv: string, filename: string, options: CsvDownloadOptions = {}): void => {
  const type = options.type ?? 'text/csv;charset=utf-8;';
  const content = options.bom ? `\ufeff${csv}` : csv;

  const blob = new Blob([content], { type });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};
