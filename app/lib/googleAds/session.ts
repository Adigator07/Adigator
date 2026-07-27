import { NextRequest, NextResponse } from "next/server";

export const GOOGLE_ADS_SESSION_COOKIE = "adigator_google_ads_session";
export const GOOGLE_ADS_STATE_COOKIE = "adigator_google_ads_oauth_state";

type GoogleAdsSession = {
  accessToken: string;
  refreshToken?: string;
  expiryAt?: number;
  scope?: string;
  tokenType?: string;
  email?: string;
};

function encodeSession(session: GoogleAdsSession): string {
  return Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
}

function decodeSession(value: string): GoogleAdsSession | null {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as GoogleAdsSession;
    if (!parsed?.accessToken) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function readGoogleAdsSession(request: NextRequest): GoogleAdsSession | null {
  const raw = request.cookies.get(GOOGLE_ADS_SESSION_COOKIE)?.value;
  if (!raw) return null;
  return decodeSession(raw);
}

export function writeGoogleAdsSession(response: NextResponse, session: GoogleAdsSession) {
  response.cookies.set({
    name: GOOGLE_ADS_SESSION_COOKIE,
    value: encodeSession(session),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearGoogleAdsSession(response: NextResponse) {
  response.cookies.set({
    name: GOOGLE_ADS_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export function writeGoogleAdsState(response: NextResponse, state: string) {
  response.cookies.set({
    name: GOOGLE_ADS_STATE_COOKIE,
    value: state,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  });
}

export function readGoogleAdsState(request: NextRequest): string | null {
  return request.cookies.get(GOOGLE_ADS_STATE_COOKIE)?.value || null;
}

export function clearGoogleAdsState(response: NextResponse) {
  response.cookies.set({
    name: GOOGLE_ADS_STATE_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}
