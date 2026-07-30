import { NextRequest } from "next/server";
import { upsertUserProfile } from "@/app/lib/firestore/profiles";
import type { RegisterRole } from "./types";

export function getRequestMeta(request: NextRequest) {
  return {
    ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || null,
    userAgent: request.headers.get("user-agent"),
  };
}

export async function syncUserProfile({
  userId,
  email,
  username,
  fullName,
  role,
}: {
  userId: string;
  email: string;
  username?: string;
  fullName: string;
  role: RegisterRole;
}) {
  await upsertUserProfile(userId, {
    email,
    username: username || fullName,
    fullName,
    role,
  });
}

export function sessionPayload(session: {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  expires_at?: number;
}) {
  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_in: session.expires_in,
    expires_at: session.expires_at,
  };
}
