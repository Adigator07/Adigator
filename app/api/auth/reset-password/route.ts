import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requestPasswordResetEmail } from "@/app/lib/auth/lockoutEmail";
import {
  GENERIC_AUTH_VALIDATION_ERROR,
  PASSWORD_RESET_REQUEST_MESSAGE,
} from "@/app/lib/auth/constants";
import { getRequestMeta } from "@/app/lib/auth/handlers";
import { logAuthValidationFailure } from "@/app/lib/auth/logValidationFailure";
import { sanitizeTextInput } from "@/app/lib/auth/sanitize";

export const runtime = "nodejs";

const resetPasswordSchema = z.object({
  email: z.string().max(254).transform(sanitizeTextInput).pipe(z.string().email()),
});

export async function POST(request: NextRequest) {
  const meta = getRequestMeta(request);

  try {
    const body = await request.json().catch(() => null);
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      logAuthValidationFailure("reset_password", {
        reason: "schema",
        issueCount: parsed.error.issues.length,
        ...meta,
      });
      return NextResponse.json({ error: GENERIC_AUTH_VALIDATION_ERROR }, { status: 400 });
    }

    const { message } = await requestPasswordResetEmail(parsed.data.email);

    return NextResponse.json({ message: message || PASSWORD_RESET_REQUEST_MESSAGE });
  } catch {
    logAuthValidationFailure("reset_password", { reason: "unexpected", ...meta });
    return NextResponse.json({ message: PASSWORD_RESET_REQUEST_MESSAGE });
  }
}
