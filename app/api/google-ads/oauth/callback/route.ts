import { NextRequest, NextResponse } from "next/server";
import {
  exchangeGoogleAdsCode,
  fetchGoogleProfileEmail,
} from "@/app/lib/googleAds/client";
import {
  clearGoogleAdsState,
  readGoogleAdsState,
  writeGoogleAdsSession,
} from "@/app/lib/googleAds/session";

export const runtime = "nodejs";

function htmlResult(ok: boolean, message: string, email?: string) {
  const payload = JSON.stringify({ type: "google-ads-auth", ok, message, email });
  const escapedMessage = message.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<!doctype html>
<html>
  <head><meta charset="utf-8" /><title>Google Ads Connection</title></head>
  <body style="font-family:Arial,sans-serif;padding:20px;background:#0e1527;color:#fff;">
    <h3>${ok ? "Google Ads connected" : "Google Ads connection failed"}</h3>
    <p>${escapedMessage}</p>
    <script>
      try {
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(${payload}, window.location.origin);
        }
      } catch (e) {}
      setTimeout(function(){ window.close(); }, 300);
    </script>
  </body>
</html>`;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code") || "";
  const state = request.nextUrl.searchParams.get("state") || "";
  const err = request.nextUrl.searchParams.get("error") || "";

  if (err) {
    return new NextResponse(htmlResult(false, `OAuth error: ${err}`), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  if (!code) {
    return new NextResponse(htmlResult(false, "Missing OAuth code."), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  const expectedState = readGoogleAdsState(request);
  if (!expectedState || !state || expectedState !== state) {
    return new NextResponse(htmlResult(false, "Invalid OAuth state. Please retry connection."), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  try {
    const tokens = await exchangeGoogleAdsCode(code, request.nextUrl.origin);
    const email = await fetchGoogleProfileEmail(tokens.access_token);

    const response = new NextResponse(
      htmlResult(true, "Your Google Ads account is now connected.", email),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );

    writeGoogleAdsSession(response, {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryAt: Date.now() + ((tokens.expires_in || 3600) * 1000),
      scope: tokens.scope,
      tokenType: tokens.token_type,
      email,
    });
    clearGoogleAdsState(response);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to exchange Google Ads token.";
    return new NextResponse(htmlResult(false, message), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}
