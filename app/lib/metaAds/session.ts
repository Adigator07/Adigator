import { NextRequest, NextResponse } from "next/server";

export const META_ADS_SESSION_COOKIE = "adigator_meta_ads_session";
export const META_ADS_STATE_COOKIE = "adigator_meta_ads_oauth_state";

export type MetaAdsSession = {
  accessToken: string;
  expiryAt?: number;
  tokenType?: string;
  email?: string;
  userId?: string;
  userName?: string;
};

function encodeSession(session: MetaAdsSession): string {
  return Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
}

function decodeSession(value: string): MetaAdsSession | null {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as MetaAdsSession;
    if (!parsed?.accessToken) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function readMetaAdsSession(request: NextRequest): MetaAdsSession | null {
  const raw = request.cookies.get(META_ADS_SESSION_COOKIE)?.value;
  if (!raw) return null;
  return decodeSession(raw);
}

export function writeMetaAdsSession(response: NextResponse, session: MetaAdsSession) {
  response.cookies.set({
    name: META_ADS_SESSION_COOKIE,
    value: encodeSession(session),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 60,
  });
}

export function clearMetaAdsSession(response: NextResponse) {
  response.cookies.set({
    name: META_ADS_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export function writeMetaAdsState(response: NextResponse, state: string) {
  response.cookies.set({
    name: META_ADS_STATE_COOKIE,
    value: state,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });
}

export function readMetaAdsState(request: NextRequest): string | null {
  return request.cookies.get(META_ADS_STATE_COOKIE)?.value || null;
}

export function clearMetaAdsState(response: NextResponse) {
  response.cookies.set({
    name: META_ADS_STATE_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
