import { createHash } from "crypto";
import { getAuthCacheStore } from "./cacheStore";

export const LOGIN_IP_LIMIT = 10;
export const LOGIN_IP_WINDOW_SEC = 60;
export const LOGIN_MAX_FAILURES = 5;
export const LOGIN_LOCKOUT_SEC = 15 * 60;
export const LOGIN_FAILURE_TTL_SEC = 60 * 60;

const KEY = {
  ipRate: (ip: string) => `auth:login:ip:${hash(ip)}`,
  failures: (email: string) => `auth:login:failures:${hash(email.toLowerCase())}`,
  lockout: (email: string) => `auth:login:lockout:${hash(email.toLowerCase())}`,
  lockNotified: (email: string) => `auth:login:lock-notified:${hash(email.toLowerCase())}`,
};

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function getProgressiveDelayMs(failureCount: number): number {
  if (failureCount <= 0) return 0;
  return Math.min(30_000, 500 * 2 ** (failureCount - 1));
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Returns true when the IP is within the allowed request budget. */
export async function checkLoginIpRateLimit(ip: string): Promise<boolean> {
  if (!ip) return true;

  const store = await getAuthCacheStore();
  const key = KEY.ipRate(ip);
  const count = await store.incr(key);
  if (count === 1) {
    await store.expire(key, LOGIN_IP_WINDOW_SEC);
  }
  return count <= LOGIN_IP_LIMIT;
}

/** Returns true when the account is currently locked out. */
export async function isLoginAccountLocked(email: string): Promise<boolean> {
  const store = await getAuthCacheStore();
  const locked = await store.get(KEY.lockout(email));
  return locked === "1";
}

export async function getLoginFailureCount(email: string): Promise<number> {
  const store = await getAuthCacheStore();
  const raw = await store.get(KEY.failures(email));
  if (!raw) return 0;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Clear failure + lockout state after a successful login. */
export async function clearLoginFailures(email: string): Promise<void> {
  const store = await getAuthCacheStore();
  await store.del(
    KEY.failures(email),
    KEY.lockout(email),
    KEY.lockNotified(email),
  );
}

export type FailedLoginResult = {
  failureCount: number;
  delayMs: number;
  locked: boolean;
  shouldNotifyLockout: boolean;
};

/**
 * Record a failed login attempt.
 * Locks after LOGIN_MAX_FAILURES consecutive failures and flags email notification once.
 */
export async function recordFailedLogin(email: string): Promise<FailedLoginResult> {
  const store = await getAuthCacheStore();
  const failureKey = KEY.failures(email);
  const failureCount = await store.incr(failureKey);

  if (failureCount === 1) {
    await store.expire(failureKey, LOGIN_FAILURE_TTL_SEC);
  }

  const delayMs = getProgressiveDelayMs(failureCount);
  let locked = false;
  let shouldNotifyLockout = false;

  if (failureCount >= LOGIN_MAX_FAILURES) {
    locked = true;
    await store.set(KEY.lockout(email), "1", LOGIN_LOCKOUT_SEC);

    const alreadyNotified = await store.get(KEY.lockNotified(email));
    if (!alreadyNotified) {
      shouldNotifyLockout = true;
      await store.set(KEY.lockNotified(email), "1", LOGIN_LOCKOUT_SEC);
    }
  }

  return { failureCount, delayMs, locked, shouldNotifyLockout };
}

/** Apply delay for locked accounts (same generic UX as progressive backoff). */
export async function getLockedAccountDelayMs(email: string): Promise<number> {
  const failures = await getLoginFailureCount(email);
  return getProgressiveDelayMs(Math.max(failures, LOGIN_MAX_FAILURES));
}
