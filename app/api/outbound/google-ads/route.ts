import { NextRequest, NextResponse } from "next/server";
import { GOOGLE_ADS_START } from "@/app/lib/siteNavigation";
import {
  createWritableSupabaseClient,
  getAccessTokenFromRequest,
  getAuthenticatedUser,
} from "@/app/lib/supabaseServer";
import { isSchemaUnavailableError } from "@/app/lib/supabaseErrors";

export const runtime = "nodejs";

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  const realIp = request.headers.get("x-real-ip") || "";
  const firstForwarded = forwarded.split(",")[0]?.trim();
  return firstForwarded || realIp || "unknown";
}

function isMissingActionLabelColumn(message: string): boolean {
  return /action_label/i.test(message) && /schema cache|column/i.test(message);
}

async function persistAuthenticatedActivity(params: {
  accessToken: string;
  source: string;
  via: string;
  referer: string;
  userAgent: string;
  ip: string;
}) {
  const { user, error } = await getAuthenticatedUser(params.accessToken);
  if (error || !user) return;

  const supabase = createWritableSupabaseClient(params.accessToken);
  const actionType = "google_ads_outbound_click";
  const actionLabel = "Google Ads outbound redirect";
  const metadata = {
    source: params.source,
    via: params.via,
    referer: params.referer,
    user_agent: params.userAgent,
    ip_address: params.ip,
    destination: GOOGLE_ADS_START.href,
  };

  const fullPayload = {
    user_id: user.id,
    action_type: actionType,
    action_label: actionLabel,
    metadata,
  };

  let { error: insertError } = await supabase.from("activity_logs").insert(fullPayload);

  if (insertError && isMissingActionLabelColumn(insertError.message)) {
    const fallbackPayload = {
      user_id: user.id,
      action_type: actionType,
      metadata: {
        ...metadata,
        action_label: actionLabel,
      },
    };
    ({ error: insertError } = await supabase.from("activity_logs").insert(fallbackPayload));
  }

  if (insertError && !isSchemaUnavailableError(insertError)) {
    throw new Error(insertError.message);
  }
}

export async function GET(request: NextRequest) {
  const source = request.nextUrl.searchParams.get("source") || "unknown";
  const via = request.nextUrl.searchParams.get("via") || "link";
  const referer = request.headers.get("referer") || "";
  const userAgent = request.headers.get("user-agent") || "";
  const ip = getClientIp(request);
  const accessToken = getAccessTokenFromRequest(request);

  if (accessToken) {
    try {
      await persistAuthenticatedActivity({
        accessToken,
        source,
        via,
        referer,
        userAgent,
        ip,
      });
    } catch (error) {
      console.warn("[OUTBOUND_GOOGLE_ADS_ACTIVITY_FAILED]", {
        message: error instanceof Error ? error.message : "unknown",
      });
    }
  }

  // Lightweight server-side event trail for outbound Google Ads clicks.
  console.info("[OUTBOUND_GOOGLE_ADS]", {
    ts: new Date().toISOString(),
    source,
    via,
    ip,
    referer,
    userAgent,
  });

  return NextResponse.redirect(GOOGLE_ADS_START.href, { status: 302 });
}
