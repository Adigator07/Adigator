import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import {
  createServerSupabaseClient,
  getAccessTokenFromRequest,
  getAuthenticatedUser,
} from "@/app/lib/supabaseServer";
import { isSchemaUnavailableError } from "@/app/lib/supabaseErrors";
import { getAnalysisPayloadFromBrain } from "@/app/lib/brains/creativeBrainPersistence";
import { runCampaignValidation } from "@/app/lib/validation/orchestratorRunner";
import type { ProgrammaticTaskTypeId } from "@/app/lib/programmaticWorkflow";
import { stripUtmFromUrl } from "@/app/lib/utmManagement";

export const runtime = "nodejs";
export const maxDuration = 120;

function json(success: boolean, data: unknown, error: string | null, status = 200) {
  return NextResponse.json({ success, data, error }, { status });
}

async function hashBuffer(buffer: Buffer): Promise<string> {
  return createHash("sha256").update(buffer).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const token = getAccessTokenFromRequest(request);
    if (!token) {
      return json(false, null, "Unauthorized — sign in to use brain reuse.", 401);
    }

    const { user, error: authError } = await getAuthenticatedUser(token);
    if (authError || !user) {
      return json(false, null, authError || "Unauthorized", 401);
    }

    const formData = await request.formData();
    const file = formData.get("image") as File | null;
    const creativeId = String(formData.get("creative_id") || "").trim();
    const campaignId = String(formData.get("campaign_id") || "").trim();
    const taskType = String(formData.get("task_type") || "creative_addition").trim() as ProgrammaticTaskTypeId;

    if (!file || !creativeId || !campaignId) {
      return json(false, null, "image, creative_id, and campaign_id are required", 400);
    }
    if (!file.type.startsWith("image/")) {
      return json(false, null, "Invalid file type. Upload an image.", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const imageBytesHash = await hashBuffer(buffer);
    const imageFile = new File([buffer], `${creativeId}.jpg`, { type: file.type || "image/jpeg" });

    const context = {
      userId: user.id,
      campaignId,
      briefText: String(formData.get("campaign_brief") || "").trim(),
      campaignGoal: String(formData.get("goal") || "awareness").trim(),
      vertical: String(formData.get("vertical") || "technology").trim(),
      targetAudience: String(formData.get("audience_stage") || "cold").trim(),
      offer: String(formData.get("offer") || formData.get("campaign_product_focus") || "").trim(),
      cta: String(formData.get("cta") || "").trim(),
      platform: String(formData.get("platform") || "programmatic").trim(),
      audienceStage: String(formData.get("audience_stage") || "cold").trim(),
      campaignProductFocus: String(formData.get("campaign_product_focus") || formData.get("offer") || "").trim(),
      landingUrl: stripUtmFromUrl(String(formData.get("landing_url") || "").trim()),
      taskType,
      platformConfig: {
        googleCampaignType: String(formData.get("google_campaign_type") || "").trim(),
      },
    };

    const supabase = createServerSupabaseClient(token);

    let result;
    try {
      result = await runCampaignValidation({
        supabase,
        context,
        creativeId,
        imageBytesHash,
        imageFile,
      });
    } catch (error) {
      if (isSchemaUnavailableError(error)) {
        return json(false, null, "Brain storage tables are not available. Run the latest Supabase migration.", 503);
      }
      throw error;
    }

    if (!result.analysis) {
      return json(false, null, "Validation completed but no analysis payload was produced.", 500);
    }

    return json(true, {
      creativeId,
      campaignId,
      creativeBrainId: result.creativeBrainId,
      campaignBrainId: result.campaignBrainId,
      landingBrainId: result.landingBrainId,
      validationBrainId: result.validationBrainId,
      reused: result.reused,
      contentHash: result.analysis.content_hash ?? imageBytesHash,
      analysis: result.analysis,
      validationVersion: result.validationVersion,
      enginesRun: result.enginesRun,
      triggerReason: result.triggerReason,
      launchReadiness: result.launchReadiness,
      alignmentScore: result.alignmentScore,
    }, null, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Validation failed.";
    console.error("[validate-campaign]", error);
    return json(false, null, message, 500);
  }
}

/** Helper for orchestrator wiring — resolves cached analysis from a brain record. */
export { getAnalysisPayloadFromBrain };
