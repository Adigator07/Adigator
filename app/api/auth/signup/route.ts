import { NextRequest, NextResponse } from "next/server";
import {
  GENERIC_AUTH_VALIDATION_ERROR,
  GENERIC_SIGNUP_RESPONSE_MESSAGE,
} from "@/app/lib/auth/constants";
import { isDuplicateSignupError } from "@/app/lib/auth/authErrors";
import {
  getRequestMeta,
  sessionPayload,
} from "@/app/lib/auth/handlers";
import { logAuthValidationFailure } from "@/app/lib/auth/logValidationFailure";
import { signUpWithSecurePassword } from "@/app/lib/auth/authService";
import type { RegisterRole } from "@/app/lib/auth/types";
import { parseSignupBody, resolveDisplayName } from "@/app/lib/auth/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const meta = getRequestMeta(request);

  try {
    const body = await request.json().catch(() => null);
    const parsed = parseSignupBody(body);

    if (!parsed.success) {
      logAuthValidationFailure("signup", {
        reason: "schema",
        issueCount: parsed.error.issues.length,
        ...meta,
      });
      return NextResponse.json({ error: GENERIC_AUTH_VALIDATION_ERROR }, { status: 400 });
    }

    const { email, password, username, role } = parsed.data;
    const displayName = resolveDisplayName(parsed.data);
    const { data, error } = await signUpWithSecurePassword({
      email,
      password,
      username,
      displayName,
      role: role as RegisterRole,
    });

    if (error) {
      logAuthValidationFailure("signup", {
        reason: "signup",
        email,
        ...meta,
      });

      if (isDuplicateSignupError(error)) {
        return NextResponse.json({ message: GENERIC_SIGNUP_RESPONSE_MESSAGE });
      }

      return NextResponse.json({ message: GENERIC_SIGNUP_RESPONSE_MESSAGE });
    }

    if (!data?.user) {
      return NextResponse.json({ message: GENERIC_SIGNUP_RESPONSE_MESSAGE });
    }

    if (!data.session) {
      return NextResponse.json({
        message: GENERIC_SIGNUP_RESPONSE_MESSAGE,
        requiresEmailConfirmation: true,
      });
    }

    return NextResponse.json({
      message: GENERIC_SIGNUP_RESPONSE_MESSAGE,
      session: sessionPayload(data.session),
      user: {
        id: data.user.id,
        email: data.user.email,
        role,
      },
    });
  } catch {
    logAuthValidationFailure("signup", { reason: "unexpected", ...meta });
    return NextResponse.json({ message: GENERIC_SIGNUP_RESPONSE_MESSAGE });
  }
}
