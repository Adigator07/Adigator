import { NextRequest, NextResponse } from "next/server";
import {
  exchangeMetaAdsCode,
  exchangeMetaLongLivedToken,
  fetchMetaGrantedPermissions,
  fetchMetaProfile,
  missingMetaAdsPermissions,
  metaAdsMissingPermissionMessage,
} from "@/app/lib/metaAds/client";
import {
  clearMetaAdsState,
  readMetaAdsState,
  writeMetaAdsSession,
} from "@/app/lib/metaAds/session";

export const runtime = "nodejs";

function htmlResult(ok: boolean, message: string, email?: string) {
  const payload = JSON.stringify({ type: "meta-ads-auth", ok, message, email })
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
  const escapeHtml = (value: string) => value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
  const escapedMessage = escapeHtml(message);
  const escapedEmail = escapeHtml(String(email || ""));
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Meta Ads Connection</title>
  </head>
  <body style="margin:0;font-family:Arial,sans-serif;background:#0e1527;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:16px;">
    <main style="width:min(560px,96vw);border:1px solid rgba(255,255,255,0.18);background:rgba(255,255,255,0.06);border-radius:14px;padding:20px 18px;">
      <h3 style="margin:0 0 10px;font-size:20px;">${ok ? "Meta Ads connected" : "Meta Ads connection failed"}</h3>
      <p style="margin:0 0 8px;color:#d9e2ff;line-height:1.5;">${escapedMessage}</p>
      ${email ? `<p style="margin:0 0 14px;color:#b8c6ff;font-size:13px;">Connected as: ${escapedEmail}</p>` : ""}
      <p id="status" style="margin:0 0 14px;color:#9fb2ff;font-size:13px;">Finalizing connection...</p>
      <button id="continue" type="button" style="border:1px solid rgba(255,255,255,0.3);background:#1a2a55;color:#fff;padding:10px 14px;border-radius:9px;cursor:pointer;font-weight:600;">
          Return to Adigator IQ
      </button>
    </main>
    <script>
      try { localStorage.setItem("adigator_meta_ads_oauth_result", JSON.stringify(${payload})); } catch (e) {}
      try {
        if ("BroadcastChannel" in window) {
          var channel = new BroadcastChannel("adigator-meta-ads-auth");
          channel.postMessage(${payload});
          channel.close();
        }
      } catch (e) {}
      var posted = false;
      function postToOpener() {
        try {
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage(${payload}, window.location.origin);
            posted = true;
          }
        } catch (e) {}
      }
      postToOpener();
      var statusEl = document.getElementById("status");
      if (statusEl) {
        statusEl.textContent = posted
          ? "Connection synced. You can return to Adigator now."
          : "Connection saved. Return to Adigator IQ and click Refresh if needed.";
      }
      var continueBtn = document.getElementById("continue");
      if (continueBtn) {
        continueBtn.addEventListener("click", function () {
          postToOpener();
          try { window.close(); } catch (e) {}
        });
      }
      if (posted) setTimeout(function () { try { window.close(); } catch (e) {} }, 1800);
    </script>
  </body>
</html>`;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code") || "";
  const state = request.nextUrl.searchParams.get("state") || "";
  const err = request.nextUrl.searchParams.get("error") || "";
  const errDescription = request.nextUrl.searchParams.get("error_description") || "";

  if (err) {
    return new NextResponse(htmlResult(false, `OAuth error: ${errDescription || err}`), {
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

  const expectedStateRaw = readMetaAdsState(request);
  let expectedNonce = expectedStateRaw || "";
  let returnTo = "/preview-tool?step=campaign-setup";
  let isPopup = true;
  try {
    const parsed = expectedStateRaw
      ? JSON.parse(expectedStateRaw) as { nonce?: string; returnTo?: string; popup?: boolean }
      : null;
    if (parsed?.nonce) {
      expectedNonce = parsed.nonce;
      returnTo = parsed.returnTo || returnTo;
      isPopup = parsed.popup !== false;
    }
  } catch {
    expectedNonce = expectedStateRaw || "";
  }

  if (!expectedNonce || !state || expectedNonce !== state) {
    return new NextResponse(htmlResult(false, "Invalid OAuth state. Please retry connection."), {
      status: 400,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  try {
    const shortLived = await exchangeMetaAdsCode(code, request.nextUrl.origin);
    let tokens = shortLived;
    try {
      tokens = await exchangeMetaLongLivedToken(shortLived.access_token);
    } catch {
      tokens = shortLived;
    }
    const profile = await fetchMetaProfile(tokens.access_token);
    let granted: string[] = [];
    try {
      granted = await fetchMetaGrantedPermissions(tokens.access_token);
    } catch {
      granted = [];
    }
    const missing = missingMetaAdsPermissions(granted);
    const session = {
      accessToken: tokens.access_token,
      expiryAt: Date.now() + ((tokens.expires_in || 3600) * 1000),
      tokenType: tokens.token_type,
      email: profile.email,
      userId: profile.id,
      userName: profile.name,
    };

    if (missing.length) {
      const response = new NextResponse(
        htmlResult(false, metaAdsMissingPermissionMessage(`Missing Meta permissions: ${missing.join(", ")}.`, granted)),
        { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } },
      );
      writeMetaAdsSession(response, session);
      clearMetaAdsState(response);
      return response;
    }

    if (!isPopup) {
      const destination = new URL(returnTo, request.nextUrl.origin);
      destination.searchParams.set("meta_ads", "connected");
      const redirect = NextResponse.redirect(destination, { status: 302 });
      writeMetaAdsSession(redirect, session);
      clearMetaAdsState(redirect);
      return redirect;
    }

    const response = new NextResponse(
      htmlResult(true, "Your Meta Ads account is now connected.", profile.email || profile.name),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
    writeMetaAdsSession(response, session);
    clearMetaAdsState(response);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to exchange Meta Ads token.";
    console.error("[Adigator] Meta OAuth token exchange failed:", message);
    return new NextResponse(htmlResult(false, message), {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}
