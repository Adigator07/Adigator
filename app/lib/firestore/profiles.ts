import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getFirebaseAdminFirestore } from "@/app/lib/firebase/admin";

export type UserProfile = {
  uid: string;
  email: string;
  username: string;
  fullName: string;
  organizationId: string;
  role: string;
  createdAt: string;
  updatedAt: string;
};

type UserProfileInput = {
  email: string;
  username?: string;
  fullName?: string;
  organizationId?: string;
  role?: string;
};

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  return new Date().toISOString();
}

function mapProfile(uid: string, data: Record<string, unknown>): UserProfile {
  const resolvedUsername = String(data.username || data.fullName || "");
  return {
    uid,
    email: String(data.email || ""),
    username: resolvedUsername,
    fullName: String(data.fullName || resolvedUsername || ""),
    organizationId: String(data.organizationId || ""),
    role: String(data.role || "member"),
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const db = getFirebaseAdminFirestore();
  const doc = await db.collection("userProfiles").doc(uid).get();
  if (!doc.exists) return null;
  return mapProfile(doc.id, doc.data() || {});
}

export async function upsertUserProfile(uid: string, input: UserProfileInput): Promise<UserProfile> {
  const db = getFirebaseAdminFirestore();
  const ref = db.collection("userProfiles").doc(uid);
  const exists = await ref.get();

  const payload: Record<string, unknown> = {
    email: input.email.trim(),
    username: input.username?.trim() || input.fullName?.trim() || "",
    fullName: input.fullName?.trim() || "",
    organizationId: input.organizationId?.trim() || "",
    role: input.role?.trim() || "member",
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (!exists.exists) {
    payload.createdAt = FieldValue.serverTimestamp();
  }

  await ref.set(payload, { merge: true });
  const updated = await ref.get();
  return mapProfile(updated.id, updated.data() || {});
}
