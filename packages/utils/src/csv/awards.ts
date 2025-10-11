/**
 * CSV export helper for prize awards
 */

export interface AwardCsvRow {
  userId: string;
  userEmail: string;
  userName: string;
  rank: number;
  prizeTitle: string;
  prizeType: string;
  prizeValue: string;
  rankRange: string;
  awardedAt: string;
  deliveredAt: string;
  notified: boolean;
  notes: string;
}

export function generateAwardsCsv(awards: AwardCsvRow[], includeBom = true): string {
  const headers = [
    "User ID",
    "Email",
    "Name",
    "Rank",
    "Prize Title",
    "Prize Type",
    "Prize Value",
    "Rank Range",
    "Awarded At",
    "Delivered At",
    "Notified",
    "Notes"
  ];

  const rows = awards.map(award => [
    award.userId,
    award.userEmail,
    award.userName,
    award.rank.toString(),
    award.prizeTitle,
    award.prizeType,
    award.prizeValue,
    award.rankRange,
    award.awardedAt,
    award.deliveredAt,
    award.notified ? "Yes" : "No",
    award.notes
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(cell => escapeCsvCell(cell)).join(","))
  ].join("\n");

  // Add BOM for Excel compatibility
  return includeBom ? "\uFEFF" + csvContent : csvContent;
}

function escapeCsvCell(cell: string): string {
  if (!cell) return '""';
  
  // Escape quotes and wrap in quotes if contains comma, quote, or newline
  if (cell.includes(",") || cell.includes('"') || cell.includes("\n")) {
    return `"${cell.replace(/"/g, '""')}"`;
  }
  
  return cell;
}
