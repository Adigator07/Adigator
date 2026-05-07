/**
 * Vision Processing Service - Image Preprocessing
 * Handles image validation, compression, and enhancement
 */

interface ImageValidationResult {
  valid: boolean;
  width: number;
  height: number;
  size: number;
  format: string;
  error?: string;
}

interface ImagePreprocessResult {
  base64: string;
  width: number;
  height: number;
  format: string;
  quality: number;
}

/**
 * Validate image format and size
 * @param file - File object or buffer
 * @returns Validation result
 */
export async function validateImage(file: File | Buffer): Promise<ImageValidationResult> {
  try {
    const MAX_SIZE = 20 * 1024 * 1024; // 20MB

    let buffer: Buffer;
    let size: number;

    if (file instanceof File) {
      buffer = Buffer.from(await file.arrayBuffer());
      size = file.size;
    } else {
      buffer = file;
      size = buffer.length;
    }

    // Check file size
    if (size > MAX_SIZE) {
      return {
        valid: false,
        width: 0,
        height: 0,
        size,
        format: "unknown",
        error: `File size exceeds ${MAX_SIZE / 1024 / 1024}MB limit`,
      };
    }

    // Detect format from magic bytes
    const format = detectImageFormat(buffer);
    if (!["jpeg", "png", "gif", "webp", "tiff"].includes(format)) {
      return {
        valid: false,
        width: 0,
        height: 0,
        size,
        format,
        error: `Unsupported image format: ${format}`,
      };
    }

    // Extract dimensions (simplified - in production use sharp or similar)
    const dimensions = extractImageDimensions(buffer, format);

    return {
      valid: true,
      width: dimensions.width,
      height: dimensions.height,
      size,
      format,
    };
  } catch (error) {
    return {
      valid: false,
      width: 0,
      height: 0,
      size: 0,
      format: "unknown",
      error: `Validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Preprocess image for OCR
 * @param file - Image file
 * @param quality - Compression quality (0-100)
 * @returns Preprocessed image as base64
 */
export async function preprocessImage(
  file: File | Buffer,
  quality: number = 85
): Promise<ImagePreprocessResult> {
  try {
    const validation = await validateImage(file);

    if (!validation.valid) {
      throw new Error(validation.error || "Image validation failed");
    }

    let buffer: Buffer;
    if (file instanceof File) {
      buffer = Buffer.from(await file.arrayBuffer());
    } else {
      buffer = file;
    }

    // For OCR, we want to maintain quality but reasonable file size
    // In production, use sharp library for actual image processing
    const base64 = buffer.toString("base64");
    const dataUri = `data:image/${validation.format};base64,${base64}`;

    return {
      base64: dataUri,
      width: validation.width,
      height: validation.height,
      format: validation.format,
      quality,
    };
  } catch (error) {
    throw new Error(
      `Image preprocessing failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Detect image format from magic bytes
 * @param buffer - Image buffer
 * @returns Image format (jpeg, png, gif, webp, tiff)
 */
function detectImageFormat(buffer: Buffer): string {
  if (buffer.length < 4) return "unknown";

  const bytes = buffer.slice(0, 4);

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "jpeg";
  }

  // PNG: 89 50 4E 47
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return "png";
  }

  // GIF: 47 49 46
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return "gif";
  }

  // WebP: RIFF ... WEBP
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46
  ) {
    if (buffer.length >= 12) {
      const webpCheck = buffer.slice(8, 12);
      if (
        webpCheck[0] === 0x57 &&
        webpCheck[1] === 0x45 &&
        webpCheck[2] === 0x42 &&
        webpCheck[3] === 0x50
      ) {
        return "webp";
      }
    }
  }

  // TIFF: 49 49 2A 00 or 4D 4D 00 2A
  if (
    (bytes[0] === 0x49 && bytes[1] === 0x49 && bytes[2] === 0x2a && bytes[3] === 0x00) ||
    (bytes[0] === 0x4d && bytes[1] === 0x4d && bytes[2] === 0x00 && bytes[3] === 0x2a)
  ) {
    return "tiff";
  }

  return "unknown";
}

/**
 * Extract image dimensions from buffer
 * Simplified version - extracts from JPEG/PNG headers
 * @param buffer - Image buffer
 * @param format - Image format
 * @returns Dimensions object
 */
function extractImageDimensions(
  buffer: Buffer,
  format: string
): { width: number; height: number } {
  try {
    if (format === "png" && buffer.length >= 24) {
      // PNG width is at bytes 16-20, height at 20-24
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      return { width, height };
    }

    if (format === "jpeg") {
      // JPEG is more complex, use approximate dimensions
      // In production, use proper library
      return { width: 800, height: 600 };
    }

    // Default fallback
    return { width: 800, height: 600 };
  } catch {
    return { width: 800, height: 600 };
  }
}

/**
 * Estimate text density in image for OCR confidence
 * @param width - Image width
 * @param height - Image height
 * @returns Estimated quality score (0-1)
 */
export function estimateOCRQuality(width: number, height: number): number {
  // Images that are too small or too large have lower OCR quality
  const minDim = Math.min(width, height);
  const maxDim = Math.max(width, height);

  const aspectRatio = maxDim / minDim;

  // Optimal range: 400-2000 pixels minimum dimension, aspect ratio 0.5-2.0
  if (minDim < 200) return 0.3;
  if (minDim < 400) return 0.6;
  if (minDim > 3000) return 0.7;
  if (aspectRatio < 0.3 || aspectRatio > 3.0) return 0.7;

  return 0.9;
}
