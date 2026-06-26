import type { AuthError } from "@supabase/supabase-js";

const DUPLICATE_SIGNUP_PATTERNS = [
  "already registered",
  "already exists",
  "user already",
  "email address is already",
  "duplicate",
];

/** True when Supabase indicates the email may already be registered. */
export function isDuplicateSignupError(error: AuthError | Error | null | undefined): boolean {
  if (!error) return false;
  const message = String(error.message || "").toLowerCase();
  return DUPLICATE_SIGNUP_PATTERNS.some((pattern) => message.includes(pattern));
}

/** Strip auth error messages that could leak account state before returning to clients. */
export function sanitizeAuthClientError(
  error: AuthError | Error | null | undefined,
): string | null {
  if (!error) return null;
  const message = String(error.message || "").toLowerCase();

  if (
    message.includes("not found")
    || message.includes("doesn't exist")
    || message.includes("does not exist")
    || message.includes("wrong password")
    || message.includes("invalid email")
    || message.includes("already registered")
    || message.includes("invalid login")
    || message.includes("invalid credentials")
    || message.includes("email not confirmed")
    || message.includes("user not found")
  ) {
    return null;
  }

  return null;
}
