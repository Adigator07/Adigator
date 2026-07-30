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
  const escapedEmail = String(email || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Google Ads Connection</title>
  </head>
  <body style="margin:0;font-family:Arial,sans-serif;background:#0e1527;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:16px;">
    <main style="width:min(560px,96vw);border:1px solid rgba(255,255,255,0.18);background:rgba(255,255,255,0.06);border-radius:14px;padding:20px 18px;box-shadow:0 16px 34px rgba(0,0,0,0.35);">
      <h3 style="margin:0 0 10px;font-size:20px;line-height:1.2;">${ok ? "Google Ads connected" : "Google Ads connection failed"}</h3>
      <p style="margin:0 0 8px;color:#d9e2ff;line-height:1.5;">${escapedMessage}</p>
      ${email ? `<p style="margin:0 0 14px;color:#b8c6ff;font-size:13px;">Connected as: ${escapedEmail}</p>` : ""}

      <p id="status" style="margin:0 0 14px;color:#9fb2ff;font-size:13px;">Finalizing connection...</p>

      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button id="continue" type="button" style="border:1px solid rgba(255,255,255,0.3);background:#1a2a55;color:#fff;padding:10px 14px;border-radius:9px;cursor:pointer;font-weight:600;">
          Return to Adigator
        </button>
        <button id="close" type="button" style="border:1px solid rgba(255,255,255,0.2);background:transparent;color:#d9e2ff;padding:10px 14px;border-radius:9px;cursor:pointer;">
          Close window
        </button>
      </div>
    </main>

    <script>
      var posted = false;
      function postToOpener() {
        try {
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage(${payload}, window.location.origin);
            posted = true;
          }
        } catch (e) {}
      }

      function tryCloseWindow() {
        window.close();
      }

      try {
        postToOpener();
      } catch (e) {}

      var statusEl = document.getElementById("status");
      var continueBtn = document.getElementById("continue");
      var closeBtn = document.getElementById("close");

      if (statusEl) {
        statusEl.textContent = posted
          ? "Connection synced. You can return to Adigator now."
          : "Connection saved. Return to Adigator and click Refresh if needed.";
      }

      if (continueBtn) {
        continueBtn.addEventListener("click", function () {
          try {
            postToOpener();
            if (window.opener && !window.opener.closed) {
              window.opener.focus();
            }
          } catch (e) {}
          tryCloseWindow();
        });
      }

      if (closeBtn) {
        closeBtn.addEventListener("click", function () {
          tryCloseWindow();
        });
      }

      if (posted) {
        setTimeout(function () { tryCloseWindow(); }, 1800);
      }
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
