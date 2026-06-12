export interface CsvSection {
  title: string;
  headers: string[];
  rows: Array<Array<string | number | boolean | null | undefined>>;
}

function escapeCsvValue(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";

  const text = String(value);
  const needsEscaping = /[",\r\n]/.test(text);
  const escaped = text.replace(/"/g, '""');

  return needsEscaping ? `"${escaped}"` : escaped;
}

function buildCsvRow(values: Array<string | number | boolean | null | undefined>): string {
  return values.map(escapeCsvValue).join(",");
}

// Purpose: Build a single CSV file from one or more labeled report sections.
export function buildCsv(sections: CsvSection[]): string {
  const lines: string[] = [];

  sections.forEach((section, index) => {
    if (index > 0) lines.push("");

    lines.push(buildCsvRow([section.title]));
    lines.push(buildCsvRow(section.headers));
    section.rows.forEach((row) => lines.push(buildCsvRow(row)));
  });

  return `${lines.join("\r\n")}\r\n`;
}

export function buildCsvFilename(prefix: string, date = new Date()): string {
  const stamp = date.toISOString().slice(0, 10);
  const safePrefix = prefix
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `${safePrefix || "report"}-${stamp}.csv`;
}
