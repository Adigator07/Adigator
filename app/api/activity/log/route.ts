import { NextRequest, NextResponse } from "next/server";

import { createServerSupabaseClient, getAccessTokenFromRequest, getAuthenticatedUser } from "@/app/lib/supabaseServer";



export const runtime = "nodejs";



type ActivityBody = {

  action_type?: string;

  event_type?: string;

  action_label?: string;

  event_label?: string;

  metadata?: Record<string, unknown>;

};



export async function POST(request: NextRequest) {

  try {

    const accessToken = getAccessTokenFromRequest(request);

    if (!accessToken) {

      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    }



    const { user, error: authError } = await getAuthenticatedUser(accessToken);

    if (authError || !user) {

      return NextResponse.json({ error: authError || "Unauthorized" }, { status: 401 });

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

    const payload = {

      user_id: user.id,

      action_type: actionType,

      action_label: actionLabel,

      metadata,

    };



    const { data, error } = await supabase

      .from("activity_logs")

      .insert(payload)

      .select("*")

      .single();



    if (error) {

      return NextResponse.json({ error: error.message }, { status: 400 });

    }



    return NextResponse.json({ event: data });

  } catch (error) {

    const message = error instanceof Error ? error.message : "Failed to log activity";

    return NextResponse.json({ error: message }, { status: 500 });

  }

}

