/** Login failure — wrong email OR wrong password OR lockout OR rate limit (never distinguish). */
export const LOGIN_INCORRECT_CREDENTIALS_ERROR = "Incorrect email or password";

/** Auth API unreachable (dev server stale, missing route, or network). */
export const LOGIN_SERVICE_UNAVAILABLE_ERROR =
  "Sign-in is temporarily unavailable. Refresh the page or restart the app server, then try again.";

/** Unexpected server error during login. */
export const LOGIN_SERVER_ERROR =
  "Something went wrong on our end. Please try again in a moment.";

/** @deprecated Use LOGIN_INCORRECT_CREDENTIALS_ERROR */
export const GENERIC_AUTH_FAILURE_ERROR = LOGIN_INCORRECT_CREDENTIALS_ERROR;

/** Schema / format validation — no field-specific hints. */
export const GENERIC_AUTH_VALIDATION_ERROR =
  "Invalid request. Please check your details and try again.";

/** Password reset request — always the same whether or not the email exists. */
export const PASSWORD_RESET_REQUEST_MESSAGE =
  "If that email is registered, you'll receive a reset link";

/**
 * Registration response — does not confirm whether the email already exists.
 * Used for new signups, email confirmation pending, and duplicate-email cases.
 */
export const GENERIC_SIGNUP_RESPONSE_MESSAGE =
  "If this email is eligible, you'll receive instructions to continue.";

/** @deprecated Use GENERIC_SIGNUP_RESPONSE_MESSAGE */
export const GENERIC_SIGNUP_FAILURE_ERROR = GENERIC_SIGNUP_RESPONSE_MESSAGE;

/** @deprecated Use GENERIC_SIGNUP_RESPONSE_MESSAGE */
export const SIGNUP_CONFIRM_EMAIL_MESSAGE = GENERIC_SIGNUP_RESPONSE_MESSAGE;

/** User lookup — avoids revealing whether an email is registered. */
export const GENERIC_USER_LOOKUP_ERROR =
  "Unable to find a user with those details.";

/** Conversation recipient lookup — avoids email enumeration. */
export const GENERIC_RECIPIENT_LOOKUP_ERROR =
  "Unable to start a conversation with that contact.";
