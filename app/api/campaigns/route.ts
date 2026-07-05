import { NextRequest, NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  getAccessTokenFromRequest,
  getAuthenticatedUser,
} from "@/app/lib/supabaseServer";
import { isSchemaUnavailableError } from "@/app/lib/supabaseErrors";

export const runtime = "nodejs";

const VALID_PLATFORMS = new Set(["google_ads", "meta_ads", "programmatic"]);

function json(success: boolean, data: unknown, error: string | null, status = 200) {
  return NextResponse.json({ success, data, error }, { status });
}

function normalizePlatform(value: unknown): string {
  const platform = String(value || "programmatic");
  return VALID_PLATFORMS.has(platform) ? platform : "programmatic";
}

export async function GET(request: NextRequest) {
  try {
    const token = getAccessTokenFromRequest(request);
    if (!token) return json(false, null, "Unauthorized", 401);

    const { user, error: authError } = await getAuthenticatedUser(token);
    if (authError || !user) return json(false, null, authError || "Unauthorized", 401);

    const campaignName = String(request.nextUrl.searchParams.get("campaign_name") || "").trim();
    const campaignId = String(request.nextUrl.searchParams.get("campaign_id") || "").trim();
    const platformFilter = request.nextUrl.searchParams.get("platform");
    const platform = platformFilter ? normalizePlatform(platformFilter) : null;

    const supabase = createServerSupabaseClient(token);

    if (campaignId && campaignName) {
      let query = supabase
        .from("campaigns")
        .select("id, platform, campaign_name, snapshot, created_at, updated_at")
        .eq("user_id", user.id)
        .eq("id", campaignId)
        .ilike("campaign_name", campaignName);

      if (platform) query = query.eq("platform", platform);

      const { data, error } = await query.maybeSingle();

      if (error) {
        if (isSchemaUnavailableError(error)) {
          return json(true, null, null, 200);
        }
        return json(false, null, error.message, 400);
      }

      if (!data) return json(true, null, null, 200);
      return json(true, {
        ...(data.snapshot as Record<string, unknown>),
        id: data.id,
        platform: data.platform,
        campaignName: data.campaign_name,
        ownerId: user.id,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      }, null, 200);
    }

    if (!campaignName) {
      return json(false, null, "campaign_name is required", 400);
    }

    let listQuery = supabase
      .from("campaigns")
      .select("id, platform, campaign_name, updated_at")
      .eq("user_id", user.id)
      .ilike("campaign_name", campaignName)
      .order("updated_at", { ascending: false });

    if (platform) listQuery = listQuery.eq("platform", platform);

    const { data, error } = await listQuery;

    if (error) {
      if (isSchemaUnavailableError(error)) {
        return json(true, [], null, 200);
      }
      return json(false, null, error.message, 400);
    }

    const options = (data || []).map((row) => ({
      id: row.id,
      campaignName: row.campaign_name,
      platform: row.platform,
      updatedAt: row.updated_at,
    }));

    return json(true, options, null, 200);
  } catch (error) {
    return json(false, null, error instanceof Error ? error.message : "Request failed", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getAccessTokenFromRequest(request);
    if (!token) return json(false, null, "Unauthorized", 401);

    const { user, error: authError } = await getAuthenticatedUser(token);
    if (authError || !user) return json(false, null, authError || "Unauthorized", 401);

    const body = await request.json();
    const platform = normalizePlatform(body.platform);
    const campaignName = String(body.campaign_name || body.campaignName || "").trim();
    const snapshot = body.snapshot;

    if (!campaignName || !snapshot || typeof snapshot !== "object") {
      return json(false, null, "campaign_name and snapshot are required", 400);
    }

    const snapshotId = String((snapshot as Record<string, unknown>).id || "").trim();
    const supabase = createServerSupabaseClient(token);

    if (snapshotId) {
      const { data: existing } = await supabase
        .from("campaigns")
        .select("id")
        .eq("user_id", user.id)
        .eq("id", snapshotId)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from("campaigns")
          .update({
            platform,
            campaign_name: campaignName,
            snapshot,
            updated_at: new Date().toISOString(),
          })
          .eq("id", snapshotId)
          .eq("user_id", user.id)
          .select("id, platform, campaign_name, created_at, updated_at")
          .single();

        if (error) {
          if (isSchemaUnavailableError(error)) return json(true, snapshot, null, 200);
          return json(false, null, error.message, 400);
        }

        return json(true, {
          id: data.id,
          platform: data.platform,
          campaignName: data.campaign_name,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        }, null, 200);
      }
    }

    const { data, error } = await supabase
      .from("campaigns")
      .insert({
        user_id: user.id,
        platform,
        campaign_name: campaignName,
        snapshot: { ...snapshot, platform, ownerId: user.id },
      })
      .select("id, platform, campaign_name, created_at, updated_at")
      .single();

    if (error) {
      if (isSchemaUnavailableError(error)) return json(true, snapshot, null, 200);
      return json(false, null, error.message, 400);
    }

    return json(true, {
      id: data.id,
      platform: data.platform,
      campaignName: data.campaign_name,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }, null, 201);
  } catch (error) {
    return json(false, null, error instanceof Error ? error.message : "Request failed", 500);
  }
}
