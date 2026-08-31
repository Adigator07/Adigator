import type { SupabaseClient } from "@supabase/supabase-js";
import type { CampaignSnapshot } from "@/app/lib/campaignSnapshot";
import { isSchemaUnavailableError } from "@/app/lib/supabaseErrors";

/** Stable key for Google Ads campaign rows (published or draft). */
export function buildGoogleAdsExternalId(snapshot: CampaignSnapshot): string {
  const customerId = String(snapshot.googleAdsCustomerId || "unknown").trim() || "unknown";
  const source = snapshot.googleAdsCampaignSource === "draft" ? "draft" : "published";
  const campaignKey = String(snapshot.id || snapshot.googleAdsDraftId || snapshot.campaignName || "")
    .trim()
    .toLowerCase();
  return `google_ads:${customerId}:${source}:${campaignKey}`;
}

/**
 * Upsert an imported Google Ads snapshot into Supabase.
 * Uses external_id so Google numeric IDs do not need to be UUIDs.
 */
export async function persistImportedGoogleAdsCampaign(
  supabase: SupabaseClient,
  userId: string,
  snapshot: CampaignSnapshot,
): Promise<{ ok: boolean; rowId?: string; error?: string }> {
  const externalId = buildGoogleAdsExternalId(snapshot);
  const now = new Date().toISOString();
  const payload = {
    user_id: userId,
    platform: "google_ads" as const,
    campaign_name: snapshot.campaignName,
    snapshot: {
      ...snapshot,
      ownerId: userId,
      importSource: "google_ads" as const,
    },
    external_id: externalId,
    updated_at: now,
  };

  try {
    const { data: existingByExternal, error: externalLookupError } = await supabase
      .from("campaigns")
      .select("id")
      .eq("user_id", userId)
      .eq("platform", "google_ads")
      .eq("external_id", externalId)
      .maybeSingle();

    if (externalLookupError && !isSchemaUnavailableError(externalLookupError)) {
      // external_id column may not exist yet — fall through to name match.
      console.warn("[Adigator] Google Ads external_id lookup failed:", externalLookupError.message);
    }

    if (existingByExternal?.id) {
      const { error } = await supabase
        .from("campaigns")
        .update(payload)
        .eq("id", existingByExternal.id)
        .eq("user_id", userId);
      if (error) {
        if (isSchemaUnavailableError(error)) return { ok: true };
        return { ok: false, error: error.message };
      }
      return { ok: true, rowId: String(existingByExternal.id) };
    }

    const { data: existingByName } = await supabase
      .from("campaigns")
      .select("id, snapshot")
      .eq("user_id", userId)
      .eq("platform", "google_ads")
      .ilike("campaign_name", snapshot.campaignName)
      .order("updated_at", { ascending: false })
      .limit(25);

    const matched = (existingByName || []).find((row) => {
      const rowSnapshot = (row.snapshot || {}) as Record<string, unknown>;
      return String(rowSnapshot.id || "") === String(snapshot.id);
    });

    if (matched?.id) {
      const { error } = await supabase
        .from("campaigns")
        .update(payload)
        .eq("id", matched.id)
        .eq("user_id", userId);
      if (error) {
        if (isSchemaUnavailableError(error)) return { ok: true };
        return { ok: false, error: error.message };
      }
      return { ok: true, rowId: String(matched.id) };
    }

    const { data: inserted, error } = await supabase
      .from("campaigns")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      if (isSchemaUnavailableError(error)) return { ok: true };
      // Retry without external_id if column missing.
      if (/external_id/i.test(error.message)) {
        const { external_id: _externalId, ...withoutExternal } = payload;
        const retry = await supabase.from("campaigns").insert(withoutExternal).select("id").single();
        if (retry.error) {
          if (isSchemaUnavailableError(retry.error)) return { ok: true };
          return { ok: false, error: retry.error.message };
        }
        return { ok: true, rowId: retry.data?.id ? String(retry.data.id) : undefined };
      }
      return { ok: false, error: error.message };
    }

    return { ok: true, rowId: inserted?.id ? String(inserted.id) : undefined };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to persist Google Ads campaign",
    };
  }
}
