import { NextRequest, NextResponse } from "next/server";
import { requireFirebaseUser } from "@/app/lib/firebase/auth";
import { uploadAssetToCloudinary } from "@/app/lib/cloudinary/server";

export const runtime = "nodejs";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireFirebaseUser(request);
    const body = await request.json().catch(() => ({}));

    const file = typeof body?.file === "string" ? body.file.trim() : "";
    if (!file) return jsonError("file is required");

    const folder = typeof body?.folder === "string" && body.folder.trim()
      ? body.folder.trim()
      : `adigator/${user.uid}`;

    const resourceType = body?.resourceType === "image"
      || body?.resourceType === "video"
      || body?.resourceType === "raw"
      || body?.resourceType === "auto"
      ? body.resourceType
      : "auto";

    const tags = Array.isArray(body?.tags)
      ? body.tags.filter((tag: unknown): tag is string => typeof tag === "string" && Boolean(tag.trim()))
      : ["adigator", "campaign-asset", user.uid];

    const uploaded = await uploadAssetToCloudinary({
      file,
      folder,
      resourceType,
      tags,
      publicId: typeof body?.publicId === "string" ? body.publicId.trim() : undefined,
    });

    return NextResponse.json({ ok: true, uploaded });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cloudinary upload failed.";
    const status = message.toLowerCase().includes("token") ? 401 : 500;
    return jsonError(message, status);
  }
}
