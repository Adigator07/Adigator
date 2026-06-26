import { createHash, timingSafeEqual } from "crypto";
import bcrypt from "bcrypt";

/** Minimum bcrypt cost factor (2^12 iterations). */
export const BCRYPT_ROUNDS = 12;

export type LegacyHashAlgorithm = "plaintext" | "md5" | "sha1" | "bcrypt";

export type PasswordHashFormat = LegacyHashAlgorithm | "unknown";

const BCRYPT_PATTERN = /^\$2[aby]\$\d{2}\$/;

/**
 * Hash a password with bcrypt (cost 12).
 * Use when persisting to app-controlled stores. Supabase Auth hashes separately on create/update.
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, BCRYPT_ROUNDS);
}

/**
 * Verify a password against a bcrypt hash (constant-time via bcrypt.compare).
 */
export async function verifyBcryptPassword(
  plainPassword: string,
  passwordHash: string,
): Promise<boolean> {
  if (!plainPassword || !passwordHash || !BCRYPT_PATTERN.test(passwordHash)) {
    return false;
  }
  return bcrypt.compare(plainPassword, passwordHash);
}

/** Detect stored hash format for migration routing. */
export function detectPasswordHashFormat(storedHash: string): PasswordHashFormat {
  const value = String(storedHash || "").trim();
  if (!value) return "unknown";
  if (BCRYPT_PATTERN.test(value)) return "bcrypt";
  if (/^[a-f0-9]{32}$/i.test(value)) return "md5";
  if (/^[a-f0-9]{40}$/i.test(value)) return "sha1";
  return "plaintext";
}

function constantTimeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function constantTimeHexEqual(provided: string, stored: string): boolean {
  const a = provided.toLowerCase();
  const b = stored.toLowerCase();
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
}

function digestHex(algorithm: "md5" | "sha1", value: string): string {
  return createHash(algorithm).update(value, "utf8").digest("hex");
}

/**
 * Verify legacy weak hashes using constant-time comparison.
 * bcrypt branch delegates to bcrypt.compare (never use ===).
 */
export async function verifyLegacyPassword(
  plainPassword: string,
  storedHash: string,
  algorithm: LegacyHashAlgorithm,
): Promise<boolean> {
  if (!plainPassword || !storedHash) return false;

  switch (algorithm) {
    case "bcrypt":
      return verifyBcryptPassword(plainPassword, storedHash);
    case "md5":
      return constantTimeHexEqual(digestHex("md5", plainPassword), storedHash);
    case "sha1":
      return constantTimeHexEqual(digestHex("sha1", plainPassword), storedHash);
    case "plaintext":
      return constantTimeStringEqual(plainPassword, storedHash);
    default:
      return false;
  }
}

/** True when a bcrypt hash uses fewer than BCRYPT_ROUNDS. */
export function bcryptNeedsRehash(passwordHash: string): boolean {
  if (!BCRYPT_PATTERN.test(passwordHash)) return true;
  const rounds = Number.parseInt(passwordHash.split("$")[2] || "0", 10);
  return !Number.isFinite(rounds) || rounds < BCRYPT_ROUNDS;
}

/** Whether a legacy row should be upgraded to Supabase-managed bcrypt on next login. */
export function legacyHashNeedsMigration(
  algorithm: LegacyHashAlgorithm,
  storedHash: string,
): boolean {
  if (algorithm === "plaintext" || algorithm === "md5" || algorithm === "sha1") {
    return true;
  }
  if (algorithm === "bcrypt") {
    return bcryptNeedsRehash(storedHash);
  }
  return true;
}
