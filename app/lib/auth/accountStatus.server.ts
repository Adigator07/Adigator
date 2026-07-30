import { getFirebaseAdminAuth, getFirebaseAdminFirestore } from "@/app/lib/firebase/admin";
import type { AccountStatus } from "./accountStatus";

export async function getProfileAccountStatus(_admin: unknown, userId: string): Promise<AccountStatus | null> {
  const db = getFirebaseAdminFirestore();
  const snap = await db.collection("userProfiles").doc(userId).get();
  if (!snap.exists) return null;
  const status = snap.data()?.status;
  if (!status) return null;
  return status as AccountStatus;
}

export async function revokeAllUserSessions(_admin: unknown, userId: string): Promise<void> {
  await getFirebaseAdminAuth().revokeRefreshTokens(userId);
}

export async function markProfilePendingApproval(_admin: unknown, userId: string): Promise<void> {
  const db = getFirebaseAdminFirestore();
  await db.collection("userProfiles").doc(userId).set(
    {
      status: "pending_verification",
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );
}