/**
 * Normalize Supabase / PostgREST errors for logging and UI messages.
 */
export function formatSupabaseError(error) {
  if (!error) return null;
  if (error instanceof Error) return error;
  if (typeof error === "string") return new Error(error);

  const message = error.message
    || error.error_description
    || error.details
    || error.hint
    || error.code;

  if (message) {
    return new Error(String(message));
  }

  try {
    return new Error(JSON.stringify(error));
  } catch {
    return new Error("Unknown database error");
  }
}

export function getSupabaseErrorMessage(error) {
  return formatSupabaseError(error)?.message || "Unknown error";
}

const SCHEMA_UNAVAILABLE_PATTERNS = [
  "could not find the table",
  "pgrst205",
  "relation",
  "does not exist",
];

export function isSchemaUnavailableError(error) {
  const message = getSupabaseErrorMessage(error).toLowerCase();
  // PostgREST reports missing columns via "schema cache" too — not a missing table.
  if (message.includes("column") && message.includes("schema cache")) {
    return false;
  }
  if (message.includes("schema cache") && !message.includes("column")) {
    return true;
  }
  return SCHEMA_UNAVAILABLE_PATTERNS.some((pattern) => message.includes(pattern));
}
