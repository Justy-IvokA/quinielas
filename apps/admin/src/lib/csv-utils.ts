/**
 * CSV Utilities for Invitations and Codes Management
 */

/**
 * Parse emails from CSV text
 * @param text - CSV content as string
 * @returns Array of valid email addresses
 */
export function parseEmailsCsv(text: string): string[] {
  const lines = text.split('\n');
  return lines
    .map(line => line.trim())
    .filter(line => line && line.includes('@'));
}

/**
 * Generate CSV content from codes array
 * @param codes - Array of code objects
 * @returns CSV string
 */
export function generateCodesCsv(codes: Array<{
  code: string;
  status: string;
  usedCount: number;
  usesPerCode: number;
  expiresAt?: string | Date | null;
}>): string {
  const headers = ['Code', 'Status', 'Used Count', 'Uses Per Code', 'Expires At'];
  const rows = codes.map(c => [
    c.code,
    c.status,
    c.usedCount.toString(),
    c.usesPerCode.toString(),
    c.expiresAt 
      ? (typeof c.expiresAt === 'string' ? c.expiresAt : c.expiresAt.toISOString())
      : 'Never'
  ]);
  
  return [headers, ...rows]
    .map(row => row.join(','))
    .join('\n');
}

/**
 * Download CSV file to user's computer
 * @param filename - Name of the file to download
 * @param content - CSV content as string
 */
export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Validate email format (basic)
 * @param email - Email string to validate
 * @returns true if valid email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Parse and validate emails from CSV
 * @param text - CSV content
 * @returns Object with valid and invalid emails
 */
export function parseAndValidateEmails(text: string): {
  valid: string[];
  invalid: string[];
} {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  const valid: string[] = [];
  const invalid: string[] = [];

  lines.forEach(line => {
    if (isValidEmail(line)) {
      valid.push(line.toLowerCase());
    } else if (line) {
      invalid.push(line);
    }
  });

  return { valid, invalid };
}
