import { NextRequest, NextResponse } from "next/server";
import {
  GENERIC_AUTH_VALIDATION_ERROR,
  LOGIN_INCORRECT_CREDENTIALS_ERROR,
} from "@/app/lib/auth/constants";
import { getRequestMeta, sessionPayload, syncUserProfile } from "@/app/lib/auth/handlers";
import { requestPasswordResetEmail } from "@/app/lib/auth/lockoutEmail";
import { logAuthValidationFailure } from "@/app/lib/auth/logValidationFailure";
import {
  checkLoginIpRateLimit,
  clearLoginFailures,
  getLockedAccountDelayMs,
  isLoginAccountLocked,
  recordFailedLogin,
  sleep,
} from "@/app/lib/auth/loginProtection";
import { signInWithSecurePassword } from "@/app/lib/auth/authService";
import type { RegisterRole } from "@/app/lib/auth/types";
import { parseLoginBody } from "@/app/lib/auth/validation";

export const runtime = "nodejs";

async function respondLoginFailure(
  reason: "rate_limit" | "locked" | "auth" | "unexpected",
  meta: ReturnType<typeof getRequestMeta>,
  email?: string,
  delayMs = 0,
) {
  if (delayMs > 0) await sleep(delayMs);

  logAuthValidationFailure("login", {
    reason,
    email,
    ...meta,
  });

  return NextResponse.json({ error: LOGIN_INCORRECT_CREDENTIALS_ERROR }, { status: 401 });
}

export async function POST(request: NextRequest) {
  const meta = getRequestMeta(request);

  try {
    const ipAllowed = await checkLoginIpRateLimit(meta.ip || "unknown");
    if (!ipAllowed) {
      return respondLoginFailure("rate_limit", meta, undefined, 250);
    }

    const body = await request.json().catch(() => null);
    const parsed = parseLoginBody(body);

    if (!parsed.success) {
      logAuthValidationFailure("login", {
        reason: "schema",
        issueCount: parsed.error.issues.length,
        ...meta,
      });
      return NextResponse.json({ error: GENERIC_AUTH_VALIDATION_ERROR }, { status: 400 });
    }

    const { email, password } = parsed.data;

    if (await isLoginAccountLocked(email)) {
      const delayMs = await getLockedAccountDelayMs(email);
      return respondLoginFailure("locked", meta, email, delayMs);
    }

    const { data, error } = await signInWithSecurePassword(email, password);

    if (error || !data.session) {
      const failure = await recordFailedLogin(email);
      if (failure.shouldNotifyLockout) {
        void requestPasswordResetEmail(email);
      }
      return respondLoginFailure("auth", meta, email, failure.delayMs);
    }

    await clearLoginFailures(email);

    const metaRole = data.session.user.user_metadata?.role as RegisterRole | undefined;
    if (metaRole && data.session.user.id) {
      await syncUserProfile({
        userId: data.session.user.id,
        email: data.session.user.email || email,
        fullName: String(data.session.user.user_metadata?.full_name || ""),
        role: metaRole,
      });
    }

    return NextResponse.json({
      session: sessionPayload(data.session),
      user: {
        id: data.session.user.id,
        email: data.session.user.email,
        role: metaRole ?? null,
      },
    });
  } catch {
    return respondLoginFailure("unexpected", meta, undefined, 250);
  }
}
