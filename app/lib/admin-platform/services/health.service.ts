import type { SupabaseClient } from "@supabase/supabase-js";

export type SystemHealth = {
  status: "healthy" | "degraded" | "down";
  uptimeSeconds: number;
  database: { status: string; latencyMs: number };
  redis: { status: string; connected: boolean };
  api: { avgLatencyMs: number; errorRate: number };
  sockets: { connections: number };
  server: {
    memoryUsageMb: number;
    cpuPercent: number;
    diskUsagePercent: number;
  };
  recentErrors: Array<{ id: string; service: string; message: string; severity: string; createdAt: string }>;
};

const bootTime = Date.now();

export async function getSystemHealth(supabase: SupabaseClient): Promise<SystemHealth> {
  const dbStart = Date.now();
  const { error: dbError } = await supabase.from("profiles").select("id", { count: "exact", head: true });
  const dbLatency = Date.now() - dbStart;

  const redisUrl = process.env.REDIS_URL;
  let redisConnected = false;
  if (redisUrl) {
    try {
      const Redis = (await import("ioredis")).default;
      const redis = new Redis(redisUrl, { connectTimeout: 2000, maxRetriesPerRequest: 1, lazyConnect: true });
      await redis.connect();
      await redis.ping();
      redisConnected = true;
      redis.disconnect();
    } catch {
      redisConnected = false;
    }
  }

  const dayAgo = new Date(Date.now() - 86400000).toISOString();
  const { data: errors, count: errorCount } = await supabase
    .from("admin_error_logs")
    .select("id, service, error_message, severity, created_at", { count: "exact" })
    .gte("created_at", dayAgo)
    .order("created_at", { ascending: false })
    .limit(10);

  const mem = process.memoryUsage();
  const errorRate = errorCount ? Math.min(100, errorCount) : 0;

  let status: SystemHealth["status"] = "healthy";
  if (dbError || dbLatency > 500) status = "degraded";
  if (dbError && dbLatency > 2000) status = "down";

  return {
    status,
    uptimeSeconds: Math.floor((Date.now() - bootTime) / 1000),
    database: {
      status: dbError ? "error" : "ok",
      latencyMs: dbLatency,
    },
    redis: {
      status: redisUrl ? (redisConnected ? "ok" : "unavailable") : "not_configured",
      connected: redisConnected,
    },
    api: {
      avgLatencyMs: dbLatency,
      errorRate,
    },
    sockets: {
      connections: Number(process.env.SOCKET_CONNECTIONS || 0),
    },
    server: {
      memoryUsageMb: Math.round(mem.heapUsed / 1024 / 1024),
      cpuPercent: 0,
      diskUsagePercent: 0,
    },
    recentErrors: (errors || []).map((e) => ({
      id: e.id,
      service: e.service,
      message: e.error_message,
      severity: e.severity,
      createdAt: e.created_at,
    })),
  };
}

export async function logError(
  supabase: SupabaseClient,
  entry: { service: string; errorMessage: string; stackTrace?: string; severity?: string },
) {
  await supabase.from("admin_error_logs").insert({
    service: entry.service,
    error_message: entry.errorMessage,
    stack_trace: entry.stackTrace || null,
    severity: entry.severity || "medium",
  });
}
