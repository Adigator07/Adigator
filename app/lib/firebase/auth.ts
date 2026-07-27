import { NextRequest } from "next/server";
import { getFirebaseAdminAuth } from "@/app/lib/firebase/admin";

export type FirebaseAuthUser = {
  uid: string;
  email: string | null;
};

function readBearerToken(request: NextRequest): string | null {
  const header = request.headers.get("authorization") || request.headers.get("Authorization");
  if (!header || !header.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  return token || null;
}

export async function requireFirebaseUser(request: NextRequest): Promise<FirebaseAuthUser> {
  const token = readBearerToken(request);
  if (!token) {
    throw new Error("Missing Firebase bearer token.");
  }

  const decoded = await getFirebaseAdminAuth().verifyIdToken(token);
  return {
    uid: decoded.uid,
    email: decoded.email || null,
  };
}
