import { NextRequest, NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  getAccessTokenFromRequest,
  getAuthenticatedUser,
} from "@/app/lib/supabaseServer";
import { isSchemaUnavailableError } from "@/app/lib/supabaseErrors";

export const runtime = "nodejs";

function json(success: boolean, data: unknown, error: string | null, status = 200) {
  return NextResponse.json({ success, data, error }, { status });
}

export async function GET(request: NextRequest) {
  try {
    const token = getAccessTokenFromRequest(request);
    if (!token) return json(false, null, "Unauthorized", 401);

    const { user, error: authError } = await getAuthenticatedUser(token);
    if (authError || !user) return json(false, null, authError || "Unauthorized", 401);

    const campaignName = String(request.nextUrl.searchParams.get("campaign_name") || "").trim();
    const campaignId = String(request.nextUrl.searchParams.get("campaign_id") || "").trim();

    const supabase = createServerSupabaseClient(token);

    if (campaignId && campaignName) {
      const { data, error } = await supabase
        .from("programmatic_campaigns")
        .select("id, campaign_name, snapshot, created_at, updated_at")
        .eq("user_id", user.id)
        .eq("id", campaignId)
        .ilike("campaign_name", campaignName)
        .maybeSingle();

      if (error) {
        if (isSchemaUnavailableError(error)) {
          return json(true, null, null, 200);
        }
        return json(false, null, error.message, 400);
      }

      if (!data) return json(true, null, null, 200);
      return json(true, {
        ...data.snapshot,
        id: data.id,
        campaignName: data.campaign_name,
        ownerId: user.id,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      }, null, 200);
    }

    if (!campaignName) {
      return json(false, null, "campaign_name is required", 400);
    }

    const { data, error } = await supabase
      .from("programmatic_campaigns")
      .select("id, campaign_name, updated_at")
      .eq("user_id", user.id)
      .ilike("campaign_name", campaignName)
      .order("updated_at", { ascending: false });

    if (error) {
      if (isSchemaUnavailableError(error)) {
        return json(true, [], null, 200);
      }
      return json(false, null, error.message, 400);
    }

    const options = (data || []).map((row) => ({
      id: row.id,
      campaignName: row.campaign_name,
      updatedAt: row.updated_at,
    }));

    return json(true, options, null, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load campaigns.";
    return json(false, null, message, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getAccessTokenFromRequest(request);
    if (!token) return json(false, null, "Unauthorized", 401);

    const { user, error: authError } = await getAuthenticatedUser(token);
    if (authError || !user) return json(false, null, authError || "Unauthorized", 401);

    const body = await request.json();
    const snapshot = body?.snapshot;
    if (!snapshot || typeof snapshot !== "object") {
      return json(false, null, "snapshot is required", 400);
    }

    const id = String(snapshot.id || "").trim();
    const campaignName = String(snapshot.campaignName || "").trim();
    if (!id || !campaignName) {
      return json(false, null, "snapshot.id and snapshot.campaignName are required", 400);
    }

    const ownerId = String(snapshot.ownerId || user.id);
    if (ownerId !== user.id) {
      return json(false, null, "Cannot save campaign for another user", 403);
    }

    const now = new Date().toISOString();
    const nextSnapshot = {
      ...snapshot,
      ownerId: user.id,
      updatedAt: now,
      createdAt: snapshot.createdAt || now,
    };

    const supabase = createServerSupabaseClient(token);
    const { data, error } = await supabase
      .from("programmatic_campaigns")
      .upsert({
        id,
        user_id: user.id,
        campaign_name: campaignName,
        snapshot: nextSnapshot,
        updated_at: now,
        created_at: nextSnapshot.createdAt,
      }, { onConflict: "id" })
      .select("id, campaign_name, snapshot, created_at, updated_at")
      .single();

    if (error) {
      if (isSchemaUnavailableError(error)) {
        return json(true, nextSnapshot, null, 200);
      }
      return json(false, null, error.message, 400);
    }

    return json(true, {
      ...data.snapshot,
      id: data.id,
      campaignName: data.campaign_name,
      ownerId: user.id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }, null, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save campaign.";
    return json(false, null, message, 500);
  }
}
