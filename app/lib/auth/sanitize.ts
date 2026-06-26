const HTML_TAG_PATTERN = /<[^>]*>/gi;
const SCRIPT_PATTERN = /<script[\s\S]*?>[\s\S]*?<\/script>/gi;
const CONTROL_CHARS_PATTERN = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

/** Remove HTML/script tags and control characters. */
export function stripHtmlAndScripts(value: string): string {
  return String(value ?? "")
    .replace(SCRIPT_PATTERN, "")
    .replace(HTML_TAG_PATTERN, "")
    .replace(CONTROL_CHARS_PATTERN, "");
}

/** Sanitize text fields (email, username, display name). */
export function sanitizeTextInput(value: string): string {
  return stripHtmlAndScripts(value).trim();
}

/**
 * Sanitize password — strip markup/control chars only.
 * Special characters are preserved for password complexity.
 */
export function sanitizePasswordInput(value: string): string {
  return stripHtmlAndScripts(String(value ?? ""));
}

/** Allowed characters for username / display name after sanitization. */
export const DISPLAY_NAME_PATTERN = /^[\p{L}\p{N}\s._'-]+$/u;
