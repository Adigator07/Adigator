import { doc, getDoc } from "firebase/firestore";
import { getFirebaseClientFirestore } from "@/app/lib/firebase/client";

export async function getClientProfileData<T extends Record<string, unknown> = Record<string, unknown>>(
  uid: string,
): Promise<T | null> {
  try {
    const db = getFirebaseClientFirestore();
    const snap = await getDoc(doc(db, "userProfiles", uid));
    return snap.exists() ? (snap.data() as T) : null;
  } catch {
    return null;
  }
}