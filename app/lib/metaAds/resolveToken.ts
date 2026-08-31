import type { NextRequest } from "next/server";
import { readMetaAdsSession, type MetaAdsSession } from "@/app/lib/metaAds/session";

export function resolveMetaAccessToken(request: NextRequest): {
  accessToken: string | null;
  session: MetaAdsSession | null;
} {
  const session = readMetaAdsSession(request);
  if (!session?.accessToken) return { accessToken: null, session };
  if (session.expiryAt && session.expiryAt - Date.now() < 0) {
    return { accessToken: null, session };
  }
  return { accessToken: session.accessToken, session };
}
