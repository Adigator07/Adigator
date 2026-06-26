import { NextRequest } from "next/server";
import { createAdminSupabaseClient } from "@/app/lib/supabaseServer";
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
  fullName,
  role,
}: {
  userId: string;
  email: string;
  fullName: string;
  role: RegisterRole;
}) {
  const admin = createAdminSupabaseClient();
  if (!admin) return;

  await admin.from("profiles").upsert(
    {
      id: userId,
      email,
      full_name: fullName,
      role,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
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
