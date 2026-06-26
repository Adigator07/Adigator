import { createServerAuthClient } from "./serverClient";
import { PASSWORD_RESET_REQUEST_MESSAGE } from "./constants";

function getPasswordResetRedirectUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL
    || process.env.NEXT_PUBLIC_SITE_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
    || "http://localhost:3000";

  return `${base.replace(/\/$/, "")}/login?reset=1`;
}

/**
 * Request a password-reset email. Always returns the same client message.
 * Never reveals whether the email is registered.
 */
export async function requestPasswordResetEmail(email: string): Promise<{
  message: string;
}> {
  try {
    const supabase = createServerAuthClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getPasswordResetRedirectUrl(),
    });
  } catch (error) {
    console.warn("[auth-reset] password reset request error:", error);
  }

  return { message: PASSWORD_RESET_REQUEST_MESSAGE };
}

/** @deprecated use requestPasswordResetEmail */
export async function sendLockoutResetEmail(email: string): Promise<void> {
  await requestPasswordResetEmail(email);
}
