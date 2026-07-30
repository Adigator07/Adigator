import {
  LOGIN_ACCOUNT_DISABLED_ERROR,
  LOGIN_PENDING_APPROVAL_ERROR,
} from "./constants";

export type AccountStatus = "active" | "suspended" | "banned" | "pending_verification";

export function getLoginBlockMessage(status: AccountStatus | null | undefined): string {
  if (status === "pending_verification") return LOGIN_PENDING_APPROVAL_ERROR;
  return LOGIN_ACCOUNT_DISABLED_ERROR;
}

export function isAccountLoginAllowed(status: AccountStatus | null | undefined): boolean {
  return status === "active";
}
