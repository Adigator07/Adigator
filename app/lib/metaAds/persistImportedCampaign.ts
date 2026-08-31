import type { SupabaseClient } from "@supabase/supabase-js";
import type { CampaignSnapshot } from "@/app/lib/campaignSnapshot";
import { isSchemaUnavailableError } from "@/app/lib/supabaseErrors";

export function buildMetaAdsExternalId(snapshot: CampaignSnapshot): string {
  const accountId = String(snapshot.metaAdsAdAccountId || "unknown").trim() || "unknown";
  const campaignKey = String(snapshot.id || snapshot.campaignName || "")
    .trim()
    .toLowerCase();
  return `meta_ads:${accountId}:${campaignKey}`;
}

export async function persistImportedMetaAdsCampaign(
  supabase: SupabaseClient,
  userId: string,
  snapshot: CampaignSnapshot,
): Promise<{ ok: boolean; rowId?: string; error?: string }> {
  const externalId = buildMetaAdsExternalId(snapshot);
  const now = new Date().toISOString();
  const payload = {
    user_id: userId,
    platform: "meta_ads" as const,
    campaign_name: snapshot.campaignName,
    snapshot: {
      ...snapshot,
      ownerId: userId,
      importSource: "meta_ads" as const,
    },
    external_id: externalId,
    updated_at: now,
  };

  try {
    const { data: existingByExternal, error: externalLookupError } = await supabase
      .from("campaigns")
      .select("id")
      .eq("user_id", userId)
      .eq("platform", "meta_ads")
      .eq("external_id", externalId)
      .maybeSingle();

    if (externalLookupError && !isSchemaUnavailableError(externalLookupError)) {
      console.warn("[Adigator] Meta Ads external_id lookup failed:", externalLookupError.message);
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

    const { data: inserted, error } = await supabase
      .from("campaigns")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      if (isSchemaUnavailableError(error)) return { ok: true };
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
      error: error instanceof Error ? error.message : "Failed to persist Meta Ads campaign",
    };
  }
}
