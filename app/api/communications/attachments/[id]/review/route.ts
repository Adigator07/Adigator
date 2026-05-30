import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createWritableSupabaseClient, getAccessTokenFromRequest, getAuthenticatedUser } from "@/app/lib/supabaseServer";
import { ensureParticipant, logCommActivity, createNotification } from "@/app/lib/communications/commServer";

export const runtime = "nodejs";

function json<T>(success: boolean, data: T | null, error: string | null, status = 200) {
  return NextResponse.json({ success, data, error }, { status });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: attachmentId } = await params;
    const token = getAccessTokenFromRequest(request);
    if (!token) return json(false, null, "Unauthorized", 401);

    const { user, error: authError } = await getAuthenticatedUser(token);
    if (authError || !user) return json(false, null, authError || "Unauthorized", 401);

    const body = await request.json();
    const status = body.status;
    const reviewNote = body.review_note ? String(body.review_note).trim() : null;

    if (!["approved", "revision_requested", "in_review", "pending"].includes(status)) {
      return json(false, null, "Invalid review status", 400);
    }

    if (status === "revision_requested" && !reviewNote) {
      return json(false, null, "Review note required for revision requests", 400);
    }

    const readClient = createServerSupabaseClient(token);

    const { data: attachment, error: attError } = await readClient
      .from("attachments")
      .select("*, message:messages!inner(conversation_id)")
      .eq("id", attachmentId)
      .single();

    if (attError || !attachment) return json(false, null, "Attachment not found", 404);

    const conversationId = (attachment as any).message.conversation_id;
    await ensureParticipant(readClient, conversationId, user.id);

    const supabase = createWritableSupabaseClient(token);

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "end_client"].includes(profile.role)) {
      return json(false, null, "Only Servicing Team members can submit creative reviews", 403);
    }

    const { data: existing } = await supabase
      .from("creative_reviews")
      .select("id")
      .eq("attachment_id", attachmentId)
      .eq("reviewer_id", user.id)
      .maybeSingle();

    const reviewPayload = {
      attachment_id: attachmentId,
      reviewer_id: user.id,
      conversation_id: conversationId,
      status,
      review_note: reviewNote,
      reviewed_at: ["approved", "revision_requested"].includes(status) ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    };

    let review;
    if (existing?.id) {
      const { data, error } = await supabase
        .from("creative_reviews")
        .update(reviewPayload)
        .eq("id", existing.id)
        .select("*")
        .single();
      if (error) return json(false, null, error.message, 400);
      review = data;
    } else {
      const { data, error } = await supabase
        .from("creative_reviews")
        .insert(reviewPayload)
        .select("*")
        .single();
      if (error) return json(false, null, error.message, 400);
      review = data;
    }

    await logCommActivity(supabase, {
      conversationId,
      userId: user.id,
      eventType: status === "in_review" ? "review_started" : "review_submitted",
      relatedAttachmentId: attachmentId,
      eventData: { file_name: attachment.file_name, status, review_note: reviewNote },
    });

    if (["approved", "revision_requested"].includes(status)) {
      const { data: conv } = await supabase
        .from("conversations")
        .select("created_by, title")
        .eq("id", conversationId)
        .single();

      if (conv) {
        await createNotification(supabase, {
          recipientId: conv.created_by,
          conversationId,
          type: status === "approved" ? "review_done" : "review_request",
          title: status === "approved" ? "Creative approved" : "Revision requested",
          body: `${profile.full_name || "Client"} ${status === "approved" ? "approved" : "requested changes on"} ${attachment.file_name}`,
        });
      }
    }

    return json(true, review, null);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to submit review";
    return json(false, null, message, 500);
  }
}
