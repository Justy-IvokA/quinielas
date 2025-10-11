/**
 * CSV export helper for invite codes
 */

export interface CodeCsvRow {
  code: string;
  status: string;
  usedCount: number;
  usesPerCode: number;
  expiresAt: string;
  createdAt: string;
}

export function generateCodesCsv(codes: CodeCsvRow[], batchName: string, includeBom = true): string {
  const headers = [
    "Code",
    "Status",
    "Used Count",
    "Uses Per Code",
    "Expires At",
    "Created At"
  ];

  const rows = codes.map(code => [
    code.code,
    code.status,
    code.usedCount.toString(),
    code.usesPerCode.toString(),
    code.expiresAt,
    code.createdAt
  ]);

  const csvContent = [
    `# Batch: ${batchName}`,
    headers.join(","),
    ...rows.map(row => row.map(cell => escapeCsvCell(cell)).join(","))
  ].join("\n");

  return includeBom ? "\uFEFF" + csvContent : csvContent;
}

function escapeCsvCell(cell: string): string {
  if (!cell) return '""';
  
  if (cell.includes(",") || cell.includes('"') || cell.includes("\n")) {
    return `"${cell.replace(/"/g, '""')}"`;
  }
  
  return cell;
}
