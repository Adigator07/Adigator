import { NextRequest, NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  createWritableSupabaseClient,
  getAccessTokenFromRequest,
  getAuthenticatedUser,
} from "@/app/lib/supabaseServer";
import { isSchemaUnavailableError } from "@/app/lib/supabaseErrors";

export const runtime = "nodejs";

function json(
  success: boolean,
  data: unknown,
  error: string | null,
  status = 200,
  extras: Record<string, unknown> = {},
) {
  return NextResponse.json({ success, data, error, ...extras }, { status });
}

export async function POST(request: NextRequest) {
  try {
    const token = getAccessTokenFromRequest(request);
    if (!token) return json(false, null, "Unauthorized", 401);

    const { user, error: authError } = await getAuthenticatedUser(token);
    if (authError || !user) return json(false, null, authError || "Unauthorized", 401);

    const body = await request.json();
    const creativeName = String(body.creative_name || "").trim();
    const creativeType = String(body.creative_type || "image").trim();
    const fileUrl = body.file_url ? String(body.file_url) : null;
    const existingId = body.id ? String(body.id) : null;

    if (!creativeName) {
      return json(false, null, "creative_name is required", 400);
    }

    const supabase = createWritableSupabaseClient(token);
    const row = {
      user_id: user.id,
      creative_name: creativeName,
      creative_type: creativeType,
      file_url: fileUrl,
      uploaded_at: new Date().toISOString(),
    };

    if (existingId) {
      const { data, error } = await supabase
        .from("creatives")
        .update(row)
        .eq("id", existingId)
        .eq("user_id", user.id)
        .select("*")
        .single();

      if (error) {
        if (isSchemaUnavailableError(error)) {
          return json(false, null, error.message, 503, { skipped: true, schemaUnavailable: true });
        }
        return json(false, null, error.message, 400);
      }

      return json(true, data, null, 200);
    }

    const { data, error } = await supabase
      .from("creatives")
      .insert(row)
      .select("*")
      .single();

    if (error) {
      if (isSchemaUnavailableError(error)) {
        return json(false, null, error.message, 503, { skipped: true, schemaUnavailable: true });
      }
      return json(false, null, error.message, 400);
    }

    return json(true, data, null, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save creative";
    if (isSchemaUnavailableError(message)) {
      return json(false, null, message, 503, { skipped: true, schemaUnavailable: true });
    }
    return json(false, null, message, 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = getAccessTokenFromRequest(request);
    if (!token) return json(false, null, "Unauthorized", 401);

    const { user, error: authError } = await getAuthenticatedUser(token);
    if (authError || !user) return json(false, null, authError || "Unauthorized", 401);

    const supabase = createServerSupabaseClient(token);
    const { data, error } = await supabase
      .from("creatives")
      .select("*")
      .eq("user_id", user.id)
      .order("uploaded_at", { ascending: false });

    if (error) {
      if (isSchemaUnavailableError(error)) {
        return json(true, [], null, 200, { skipped: true, schemaUnavailable: true });
      }
      return json(false, null, error.message, 400);
    }

    return json(true, data || [], null);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch creatives";
    return json(false, null, message, 500);
  }
}
