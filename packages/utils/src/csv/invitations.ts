/**
 * CSV export helper for invitations
 */

export interface InvitationCsvRow {
  email: string;
  status: string;
  token: string;
  sentCount: number;
  lastSentAt: string;
  openedAt: string;
  clickedAt: string;
  acceptedAt: string;
  expiresAt: string;
  createdAt: string;
}

export function generateInvitationsCsv(invitations: InvitationCsvRow[], includeBom = true): string {
  const headers = [
    "Email",
    "Status",
    "Token",
    "Sent Count",
    "Last Sent",
    "Opened At",
    "Clicked At",
    "Accepted At",
    "Expires At",
    "Created At"
  ];

  const rows = invitations.map(inv => [
    inv.email,
    inv.status,
    inv.token,
    inv.sentCount.toString(),
    inv.lastSentAt,
    inv.openedAt,
    inv.clickedAt,
    inv.acceptedAt,
    inv.expiresAt,
    inv.createdAt
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map(row => row.map(cell => escapeCsvCell(cell)).join(","))
  ].join("\n");

  return includeBom ? "\uFEFF" + csvContent : csvContent;
}

/**
 * Parse CSV content to extract emails
 */
export function parseInvitationsCsv(csvContent: string): string[] {
  const lines = csvContent.trim().split("\n");
  const emails: string[] = [];

  // Skip header if present (detect by checking if first line contains "email")
  const startIndex = lines[0]?.toLowerCase().includes("email") ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple CSV parsing (assumes email is first column or only column)
    const email = line.split(",")[0].replace(/^["']|["']$/g, "").trim();
    
    if (email && isValidEmail(email)) {
      emails.push(email);
    }
  }

  return emails;
}

function escapeCsvCell(cell: string): string {
  if (!cell) return '""';
  
  if (cell.includes(",") || cell.includes('"') || cell.includes("\n")) {
    return `"${cell.replace(/"/g, '""')}"`;
  }
  
  return cell;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
