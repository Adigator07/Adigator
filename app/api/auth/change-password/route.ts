import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { changePasswordSecure } from "@/app/lib/auth/authService";
import {
  GENERIC_AUTH_VALIDATION_ERROR,
  LOGIN_INCORRECT_CREDENTIALS_ERROR,
} from "@/app/lib/auth/constants";
import { getRequestMeta } from "@/app/lib/auth/handlers";
import { logAuthValidationFailure } from "@/app/lib/auth/logValidationFailure";
import { sanitizePasswordInput, sanitizeTextInput } from "@/app/lib/auth/sanitize";
import { getAccessTokenFromRequest } from "@/app/lib/supabaseServer";

export const runtime = "nodejs";

const changePasswordSchema = z.object({
  email: z.string().max(254).transform(sanitizeTextInput).pipe(z.string().email()),
  currentPassword: z.string().max(128).transform(sanitizePasswordInput).pipe(z.string().min(1)),
  newPassword: z
    .string()
    .max(128)
    .transform(sanitizePasswordInput)
    .pipe(
      z
        .string()
        .min(8)
        .max(128)
        .regex(/[A-Za-z]/)
        .regex(/[0-9]/),
    ),
});

export async function POST(request: NextRequest) {
  const meta = getRequestMeta(request);
  const accessToken = getAccessTokenFromRequest(request);

  if (!accessToken) {
    return NextResponse.json({ error: LOGIN_INCORRECT_CREDENTIALS_ERROR }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => null);
    const parsed = changePasswordSchema.safeParse(body);

    if (!parsed.success) {
      logAuthValidationFailure("change_password", {
        reason: "schema",
        issueCount: parsed.error.issues.length,
        ...meta,
      });
      return NextResponse.json({ error: GENERIC_AUTH_VALIDATION_ERROR }, { status: 400 });
    }

    const { email, currentPassword, newPassword } = parsed.data;

    const result = await changePasswordSecure({
      accessToken,
      email,
      currentPassword,
      newPassword,
    });

    if (!result.ok) {
      logAuthValidationFailure("change_password", { reason: "auth", email, ...meta });
      return NextResponse.json({ error: LOGIN_INCORRECT_CREDENTIALS_ERROR }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch {
    logAuthValidationFailure("change_password", { reason: "unexpected", ...meta });
    return NextResponse.json({ error: LOGIN_INCORRECT_CREDENTIALS_ERROR }, { status: 500 });
  }
}
