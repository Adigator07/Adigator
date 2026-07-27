import { v2 as cloudinary } from "cloudinary";

type UploadInput = {
  file: string;
  folder?: string;
  publicId?: string;
  resourceType?: "image" | "video" | "raw" | "auto";
  tags?: string[];
};

let configured = false;

function ensureCloudinaryConfig() {
  if (configured) return;

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary environment variables are not configured.");
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  configured = true;
}

export async function uploadAssetToCloudinary(input: UploadInput) {
  ensureCloudinaryConfig();

  const result = await cloudinary.uploader.upload(input.file, {
    folder: input.folder || "adigator",
    public_id: input.publicId,
    resource_type: input.resourceType || "auto",
    tags: input.tags,
    use_filename: true,
    unique_filename: input.publicId ? false : true,
    overwrite: false,
  });

  return {
    assetId: result.asset_id,
    publicId: result.public_id,
    secureUrl: result.secure_url,
    format: result.format,
    bytes: result.bytes,
    width: result.width || null,
    height: result.height || null,
    resourceType: result.resource_type,
    createdAt: result.created_at,
    originalFilename: result.original_filename,
  };
}
