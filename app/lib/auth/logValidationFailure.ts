type AuthValidationContext = "login" | "signup" | "change_password" | "reset_password";

type AuthValidationLog = {
  context: AuthValidationContext;
  reason: "schema" | "auth" | "signup" | "unexpected" | "rate_limit" | "locked";
  issueCount?: number;
  ip?: string | null;
  userAgent?: string | null;
};

function redactEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "[redacted]";
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

/** Server-side monitoring log — never log passwords or full payloads. */
export function logAuthValidationFailure(
  context: AuthValidationContext,
  payload: Omit<AuthValidationLog, "context"> & { email?: string },
) {
  const entry = {
    context,
    reason: payload.reason,
    issueCount: payload.issueCount,
    ip: payload.ip ?? null,
    userAgent: payload.userAgent ?? null,
    email: payload.email ? redactEmail(payload.email) : undefined,
    timestamp: new Date().toISOString(),
  };

  console.warn("[auth-validation]", JSON.stringify(entry));
}
