/**
 * CSV export utilities for audit logs
 */

export interface AuditLogRow {
  id: string;
  tenantId: string;
  actorId: string | null;
  userId: string | null;
  action: string;
  ipAddress: string | null;
  userAgent: string | null;
  resourceType: string | null;
  resourceId: string | null;
  createdAt: Date;
  metadata?: unknown;
  actorEmail?: string | null;
  userEmail?: string | null;
}

/**
 * Converts audit logs to CSV format
 */
export function auditLogsToCsv(logs: AuditLogRow[]): string {
  const headers = [
    "ID",
    "Tenant ID",
    "Actor Email",
    "User Email",
    "Action",
    "IP Address",
    "User Agent",
    "Resource Type",
    "Resource ID",
    "Created At",
    "Metadata",
  ];

  const rows = logs.map((log) => [
    log.id,
    log.tenantId,
    log.actorEmail ?? "",
    log.userEmail ?? "",
    log.action,
    log.ipAddress ?? "",
    escapeCsvField(log.userAgent ?? ""),
    log.resourceType ?? "",
    log.resourceId ?? "",
    log.createdAt.toISOString(),
    escapeCsvField(JSON.stringify(log.metadata ?? {})),
  ]);

  const csvLines = [headers.join(","), ...rows.map((row) => row.join(","))];

  return csvLines.join("\n");
}

/**
 * Escapes a field for CSV format
 */
function escapeCsvField(field: string): string {
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/**
 * Converts audit logs to JSON format
 */
export function auditLogsToJson(logs: AuditLogRow[]): string {
  return JSON.stringify(logs, null, 2);
}
