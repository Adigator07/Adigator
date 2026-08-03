import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient, getAccessTokenFromRequest, getAuthenticatedUser } from "@/app/lib/supabaseServer";
import { isSchemaUnavailableError } from "@/app/lib/supabaseErrors";

export const runtime = "nodejs";

type ActivityBody = {
  action_type?: string;
  event_type?: string;
  action_label?: string;
  event_label?: string;
  metadata?: Record<string, unknown>;
};

function isMissingActionLabelColumn(message: string): boolean {
  return /action_label/i.test(message) && /schema cache|column/i.test(message);
}

export async function POST(request: NextRequest) {
  try {
    const accessToken = getAccessTokenFromRequest(request);
    if (!accessToken) {
      return NextResponse.json({ skipped: true, serviceUnavailable: true, error: "Unauthorized" }, { status: 200 });
    }

    const { user, error: authError } = await getAuthenticatedUser(accessToken);
    if (authError || !user) {
      return NextResponse.json({ skipped: true, serviceUnavailable: true, error: authError || "Unauthorized" }, { status: 200 });
    }

    const body = (await request.json()) as ActivityBody;
    const actionType = String(body.action_type || body.event_type || "").trim();
    if (!actionType) {
      return NextResponse.json({ error: "action_type is required" }, { status: 400 });
    }

    const actionLabel = String(
      body.action_label || body.event_label || actionType.replace(/_/g, " "),
    ).trim();

    const metadata = body.metadata && typeof body.metadata === "object" ? body.metadata : {};

    const supabase = createServerSupabaseClient(accessToken);

    const fullPayload = {
      user_id: user.id,
      action_type: actionType,
      action_label: actionLabel,
      metadata,
    };

    let { data, error } = await supabase
      .from("activity_logs")
      .insert(fullPayload)
      .select("*")
      .single();

    if (error && isMissingActionLabelColumn(error.message)) {
      const fallbackPayload = {
        user_id: user.id,
        action_type: actionType,
        metadata: {
          ...metadata,
          action_label: actionLabel,
        },
      };
      ({ data, error } = await supabase
        .from("activity_logs")
        .insert(fallbackPayload)
        .select("*")
        .single());
    }

    if (error) {
      if (isSchemaUnavailableError(error)) {
        return NextResponse.json({
          skipped: true,
          schemaUnavailable: true,
          event: null,
        });
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ event: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to log activity";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
