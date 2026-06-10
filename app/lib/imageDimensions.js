/**
 * Reliable image dimension reading for creative validation.
 * Reads stored pixel dimensions from file headers (PNG/JPEG/GIF/WebP) as the
 * single source of truth. JPEG EXIF orientation is applied to width/height
 * only — no decode, resize, or IAB snapping.
 */

export const SIZE_TOLERANCE_PX = 4;

function toUint8Array(input) {
  if (input instanceof Uint8Array) return input;
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  if (ArrayBuffer.isView(input)) {
    return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  }
  throw new Error("Expected ArrayBuffer or Uint8Array for dimension reading.");
}

function readUint16BE(bytes, offset) {
  return (bytes[offset] << 8) | bytes[offset + 1];
}

function readUint32BE(bytes, offset) {
  return (
    ((bytes[offset] << 24) >>> 0)
    + (bytes[offset + 1] << 16)
    + (bytes[offset + 2] << 8)
    + bytes[offset + 3]
  );
}

function readUint16LE(bytes, offset) {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

function readUint24LE(bytes, offset) {
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
}

function isPng(bytes) {
  return bytes.length >= 24
    && bytes[0] === 0x89
    && bytes[1] === 0x50
    && bytes[2] === 0x4E
    && bytes[3] === 0x47;
}

function readPngDimensions(bytes) {
  if (!isPng(bytes)) return null;
  const width = readUint32BE(bytes, 16);
  const height = readUint32BE(bytes, 20);
  if (!width || !height) return null;
  return { width, height, format: "png" };
}

function isGif(bytes) {
  return bytes.length >= 10
    && bytes[0] === 0x47
    && bytes[1] === 0x49
    && bytes[2] === 0x46;
}

function readGifDimensions(bytes) {
  if (!isGif(bytes)) return null;
  const width = readUint16LE(bytes, 6);
  const height = readUint16LE(bytes, 8);
  if (!width || !height) return null;
  return { width, height, format: "gif" };
}

function isWebp(bytes) {
  return bytes.length >= 30
    && bytes[0] === 0x52
    && bytes[1] === 0x49
    && bytes[2] === 0x46
    && bytes[3] === 0x46
    && bytes[8] === 0x57
    && bytes[9] === 0x45
    && bytes[10] === 0x42
    && bytes[11] === 0x50;
}

function readWebpDimensions(bytes) {
  if (!isWebp(bytes)) return null;

  const chunkStart = 12;
  const fourcc = String.fromCharCode(bytes[chunkStart], bytes[chunkStart + 1], bytes[chunkStart + 2], bytes[chunkStart + 3]);

  if (fourcc === "VP8X" && bytes.length >= chunkStart + 14) {
    const width = 1 + readUint24LE(bytes, chunkStart + 8);
    const height = 1 + readUint24LE(bytes, chunkStart + 11);
    if (!width || !height) return null;
    return { width, height, format: "webp" };
  }

  if (fourcc === "VP8 " && bytes.length >= chunkStart + 18) {
    const width = readUint16LE(bytes, chunkStart + 14) & 0x3fff;
    const height = readUint16LE(bytes, chunkStart + 16) & 0x3fff;
    if (!width || !height) return null;
    return { width, height, format: "webp" };
  }

  if (fourcc === "VP8L" && bytes.length >= chunkStart + 9) {
    const bits = readUint32LE(bytes, chunkStart + 5);
    const width = 1 + (bits & 0x3fff);
    const height = 1 + ((bits >> 14) & 0x3fff);
    if (!width || !height) return null;
    return { width, height, format: "webp" };
  }

  return null;
}

function readUint32LE(bytes, offset) {
  return (
    bytes[offset]
    | (bytes[offset + 1] << 8)
    | (bytes[offset + 2] << 16)
    | (bytes[offset + 3] << 24)
  ) >>> 0;
}

function isJpeg(bytes) {
  return bytes.length >= 4 && bytes[0] === 0xFF && bytes[1] === 0xD8;
}

function readExifOrientation(bytes, offset, length) {
  if (length < 8) return 1;
  if (String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]) !== "Exif") {
    return 1;
  }

  const tiffStart = offset + 6;
  if (tiffStart + 8 >= bytes.length) return 1;

  const littleEndian = bytes[tiffStart] === 0x49 && bytes[tiffStart + 1] === 0x49;
  const read16 = littleEndian
    ? (pos) => readUint16LE(bytes, pos)
    : (pos) => readUint16BE(bytes, pos);
  const read32 = littleEndian
    ? (pos) => readUint32LE(bytes, pos)
    : (pos) => readUint32BE(bytes, pos);

  const ifdOffset = read32(tiffStart + 4);
  const ifdStart = tiffStart + ifdOffset;
  if (ifdStart + 2 >= bytes.length) return 1;

  const entryCount = read16(ifdStart);
  for (let index = 0; index < entryCount; index += 1) {
    const entryOffset = ifdStart + 2 + index * 12;
    if (entryOffset + 12 > bytes.length) break;

    const tag = read16(entryOffset);
    if (tag !== 0x0112) continue;

    const value = read16(entryOffset + 8);
    return value >= 1 && value <= 8 ? value : 1;
  }

  return 1;
}

function applyExifOrientation(width, height, orientation) {
  if (orientation >= 5 && orientation <= 8) {
    return { width: height, height: width };
  }
  return { width, height };
}

function readJpegDimensions(bytes) {
  if (!isJpeg(bytes)) return null;

  let offset = 2;
  let orientation = 1;
  let width = 0;
  let height = 0;

  while (offset + 4 < bytes.length) {
    if (bytes[offset] !== 0xFF) {
      offset += 1;
      continue;
    }

    while (offset < bytes.length && bytes[offset] === 0xFF) offset += 1;
    if (offset >= bytes.length) break;

    const marker = bytes[offset];
    offset += 1;

    if (marker === 0xD9 || marker === 0xDA) break;
    if (offset + 1 >= bytes.length) break;

    const segmentLength = readUint16BE(bytes, offset);
    if (segmentLength < 2) break;

    const segmentStart = offset + 2;
    const segmentEnd = offset + segmentLength;
    if (segmentEnd > bytes.length) break;

    if (marker === 0xE1 && segmentLength >= 8) {
      orientation = readExifOrientation(bytes, segmentStart, segmentLength - 2);
    }

    const isSof = (
      (marker >= 0xC0 && marker <= 0xC3)
      || (marker >= 0xC5 && marker <= 0xC7)
      || (marker >= 0xC9 && marker <= 0xCB)
      || (marker >= 0xCD && marker <= 0xCF)
    );

    if (isSof && segmentStart + 7 < segmentEnd) {
      height = readUint16BE(bytes, segmentStart + 3);
      width = readUint16BE(bytes, segmentStart + 5);
    }

    offset = segmentEnd;
  }

  if (!width || !height) return null;

  return {
    width,
    height,
    format: "jpeg",
    storedWidth: width,
    storedHeight: height,
    exifOrientation: orientation,
  };
}

/**
 * Read width/height from encoded image bytes without decoding or transforming pixels.
 */
export function readImageDimensionsFromBuffer(buffer) {
  const bytes = toUint8Array(buffer);

  return readPngDimensions(bytes)
    || readGifDimensions(bytes)
    || readWebpDimensions(bytes)
    || readJpegDimensions(bytes);
}

function buildDimensionResult(width, height, extra = {}) {
  const rawW = Math.max(1, Math.round(Number(width) || 0));
  const rawH = Math.max(1, Math.round(Number(height) || 0));
  return {
    width: rawW,
    height: rawH,
    size: `${rawW}x${rawH}`,
    detectedWidth: rawW,
    detectedHeight: rawH,
    normalized: false,
    ...extra,
  };
}

async function readImageDimensionsViaBitmap(blob) {
  let bitmap;
  try {
    bitmap = await createImageBitmap(blob);
  } catch {
    return null;
  }

  try {
    return buildDimensionResult(bitmap.width, bitmap.height, { source: "bitmap_decode" });
  } finally {
    if (typeof bitmap.close === "function") bitmap.close();
  }
}

/**
 * Read display-oriented dimensions from a File/Blob using file metadata first.
 */
export async function readImageDimensionsFromBlob(blob) {
  if (!(blob instanceof Blob)) {
    throw new Error("Expected a Blob or File for dimension reading.");
  }

  try {
    const headerBytes = Math.min(blob.size, 512 * 1024);
    const buffer = await blob.slice(0, headerBytes).arrayBuffer();
    const fromHeader = readImageDimensionsFromBuffer(buffer);
    if (fromHeader?.width && fromHeader?.height) {
      return buildDimensionResult(fromHeader.width, fromHeader.height, {
        source: "file_metadata",
        format: fromHeader.format,
        exifOrientation: fromHeader.exifOrientation,
        storedWidth: fromHeader.storedWidth,
        storedHeight: fromHeader.storedHeight,
      });
    }

    if (blob.size > headerBytes) {
      const fullBuffer = await blob.arrayBuffer();
      const fromFullFile = readImageDimensionsFromBuffer(fullBuffer);
      if (fromFullFile?.width && fromFullFile?.height) {
        return buildDimensionResult(fromFullFile.width, fromFullFile.height, {
          source: "file_metadata",
          format: fromFullFile.format,
          exifOrientation: fromFullFile.exifOrientation,
          storedWidth: fromFullFile.storedWidth,
          storedHeight: fromFullFile.storedHeight,
        });
      }
    }
  } catch {
    // Fall through to bitmap decode.
  }

  const fromBitmap = await readImageDimensionsViaBitmap(blob);
  if (fromBitmap) return fromBitmap;

  throw new Error("Could not read image dimensions from file.");
}

export function formatCreativeSize(width, height) {
  return buildDimensionResult(width, height).size;
}

/** @deprecated Use matchPlatformSupportedSize in creativeValidation for compatibility checks only. */
export function normalizeCreativeDimensions(width, height) {
  return buildDimensionResult(width, height);
}
