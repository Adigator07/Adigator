import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuditLogEntry } from "../types";

export async function writeAuditLog(
  supabase: SupabaseClient,
  entry: {
    adminId: string;
    action: string;
    targetUserId?: string | null;
    description: string;
    ipAddress?: string;
    device?: string;
    browser?: string;
    metadata?: Record<string, unknown>;
  },
) {
  const { error } = await supabase.from("admin_audit_logs").insert({
    admin_id: entry.adminId,
    action: entry.action,
    target_user_id: entry.targetUserId || null,
    description: entry.description,
    ip_address: entry.ipAddress || null,
    device: entry.device || null,
    browser: entry.browser || null,
    metadata: entry.metadata || {},
  });
  if (error) console.error("[audit]", error.message);
}

export async function listAuditLogs(
  supabase: SupabaseClient,
  opts: { limit?: number; adminId?: string; targetUserId?: string } = {},
): Promise<AuditLogEntry[]> {
  const limit = Math.min(500, opts.limit || 100);
  let q = supabase
    .from("admin_audit_logs")
    .select(`
      id, admin_id, action, target_user_id, description,
      ip_address, device, browser, timestamp,
      admin:profiles!admin_audit_logs_admin_id_fkey(full_name, email),
      target:profiles!admin_audit_logs_target_user_id_fkey(full_name, email)
    `)
    .order("timestamp", { ascending: false })
    .limit(limit);

  if (opts.adminId) q = q.eq("admin_id", opts.adminId);
  if (opts.targetUserId) q = q.eq("target_user_id", opts.targetUserId);

  const { data, error } = await q;
  if (error) {
    // Fallback without joins if FK names differ
    const fallback = await supabase
      .from("admin_audit_logs")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(limit);
    if (fallback.error) throw new Error(fallback.error.message);
    return (fallback.data || []).map((row) => ({
      id: row.id,
      adminId: row.admin_id,
      adminName: row.admin_id?.slice(0, 8) || "Admin",
      action: row.action,
      targetUserId: row.target_user_id,
      targetUserName: row.target_user_id?.slice(0, 8) || null,
      description: row.description,
      ipAddress: row.ip_address,
      device: row.device,
      browser: row.browser,
      timestamp: row.timestamp,
    }));
  }

  return (data || []).map((row: Record<string, unknown>) => {
    const admin = row.admin as { full_name?: string; email?: string } | null;
    const target = row.target as { full_name?: string; email?: string } | null;
    return {
      id: String(row.id),
      adminId: String(row.admin_id),
      adminName: admin?.full_name || admin?.email || "Admin",
      action: String(row.action),
      targetUserId: row.target_user_id ? String(row.target_user_id) : null,
      targetUserName: target?.full_name || target?.email || null,
      description: String(row.description),
      ipAddress: row.ip_address ? String(row.ip_address) : null,
      device: row.device ? String(row.device) : null,
      browser: row.browser ? String(row.browser) : null,
      timestamp: String(row.timestamp),
    };
  });
}

export function auditLogsToCsv(logs: AuditLogEntry[]): string {
  const headers = ["timestamp", "admin", "action", "target", "description", "ip"];
  const rows = logs.map((l) => [
    l.timestamp,
    l.adminName,
    l.action,
    l.targetUserName || "",
    l.description,
    l.ipAddress || "",
  ]);
  return [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
}
