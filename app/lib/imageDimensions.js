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

function isJpegSofMarker(marker) {
  return (
    (marker >= 0xC0 && marker <= 0xC3)
    || (marker >= 0xC5 && marker <= 0xC7)
    || (marker >= 0xC9 && marker <= 0xCB)
    || (marker >= 0xCD && marker <= 0xCF)
  );
}

function readJpegDimensions(bytes) {
  if (!isJpeg(bytes)) return null;

  let offset = 2;
  let orientation = 1;
  /** @type {Array<{ width: number; height: number }>} */
  const sofCandidates = [];

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

    if (isJpegSofMarker(marker) && segmentStart + 7 < segmentEnd) {
      const segmentHeight = readUint16BE(bytes, segmentStart + 3);
      const segmentWidth = readUint16BE(bytes, segmentStart + 5);
      if (segmentWidth > 0 && segmentHeight > 0) {
        sofCandidates.push({ width: segmentWidth, height: segmentHeight });
      }
    }

    offset = segmentEnd;
  }

  if (sofCandidates.length === 0) return null;

  // Progressive / multi-scan JPEGs may include low-resolution SOF segments first.
  // Use the largest frame — that is the full creative resolution.
  const best = sofCandidates.reduce((largest, candidate) => {
    const candidateArea = candidate.width * candidate.height;
    const largestArea = largest.width * largest.height;
    return candidateArea >= largestArea ? candidate : largest;
  });

  const oriented = applyExifOrientation(best.width, best.height, orientation);

  return {
    width: oriented.width,
    height: oriented.height,
    format: "jpeg",
    storedWidth: best.width,
    storedHeight: best.height,
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
    bitmap = await createImageBitmap(blob, { imageOrientation: "from-image" });
  } catch {
    try {
      bitmap = await createImageBitmap(blob);
    } catch {
      return null;
    }
  }

  try {
    return buildDimensionResult(bitmap.width, bitmap.height, { source: "bitmap_decode" });
  } finally {
    if (typeof bitmap.close === "function") bitmap.close();
  }
}

/** Parse WxH from common ad file naming patterns (300x250, 300-250, 728_x_90). */
export function extractExpectedSizeFromFilename(fileName) {
  const base = String(fileName || "").replace(/\.[^/.]+$/, "");
  const patterns = [
    /\b(\d{2,4})\s*[x×]\s*(\d{2,4})\b/i,
    /\b(\d{2,4})\s*-\s*(\d{2,4})\b/,
    /\b(\d{2,4})\s*_\s*(\d{2,4})\b/,
  ];

  for (const pattern of patterns) {
    const match = base.match(pattern);
    if (!match) continue;
    const width = Number(match[1]);
    const height = Number(match[2]);
    if (width >= 50 && height >= 50 && width <= 4096 && height <= 4096) {
      return { width, height };
    }
  }

  return null;
}

/**
 * Prefer filename dimensions when metadata read is clearly wrong but the name encodes
 * a standard IAB size (common when JPEG headers contain multiple SOF segments).
 */
export function reconcileDimensionsWithFilename(fileName, dimensions) {
  if (!dimensions?.width || !dimensions?.height) return dimensions;

  const expected = extractExpectedSizeFromFilename(fileName);
  if (!expected) return dimensions;

  const { width: dw, height: dh } = dimensions;
  const { width: ew, height: eh } = expected;

  if (dw === ew && dh === eh) return dimensions;
  if (dw === eh && dh === ew) {
    return buildDimensionResult(ew, eh, {
      source: "filename_swapped",
      format: dimensions.format,
    });
  }

  const widthMatchesExpected = dh === ew && dw !== eh;
  const heightMatchesExpected = dw === eh && dh !== ew;
  const oneAxisMatches = (dh === ew || dw === eh) && (dw !== ew || dh !== eh);

  if (widthMatchesExpected || heightMatchesExpected || oneAxisMatches) {
    return buildDimensionResult(ew, eh, {
      source: "filename_reconcile",
      format: dimensions.format,
    });
  }

  // Metadata read can pick embedded preview scans (e.g. 769×2105 instead of 1080×1080).
  // When the filename encodes a standard ad size and detected pixels clearly disagree, trust the name.
  const tolerance = SIZE_TOLERANCE_PX;
  const widthDelta = Math.abs(dw - ew);
  const heightDelta = Math.abs(dh - eh);
  const swappedWidthDelta = Math.abs(dw - eh);
  const swappedHeightDelta = Math.abs(dh - ew);
  const exactishMatch = widthDelta <= tolerance && heightDelta <= tolerance;
  const swappedExactish = swappedWidthDelta <= tolerance && swappedHeightDelta <= tolerance;

  if (!exactishMatch && !swappedExactish) {
    const expectedRatio = ew / eh;
    const detectedRatio = dw / dh;
    const ratioDrift = Math.abs(Math.log(expectedRatio / detectedRatio));
    const bothAxesFarOff = widthDelta > 50 && heightDelta > 50
      && swappedWidthDelta > 50 && swappedHeightDelta > 50;

    if (bothAxesFarOff || ratioDrift > 0.12) {
      return buildDimensionResult(ew, eh, {
        source: "filename_trusted",
        format: dimensions.format,
        reconciledFrom: `${dw}x${dh}`,
      });
    }
  }

  return dimensions;
}

/**
 * Read display-oriented dimensions from a File/Blob using file metadata first.
 */
export async function readImageDimensionsFromBlob(blob, options = {}) {
  const fileName = options.fileName || (blob instanceof File ? blob.name : "");

  try {
    const headerBytes = Math.min(blob.size, 512 * 1024);
    const buffer = await blob.slice(0, headerBytes).arrayBuffer();
    const fromHeader = readImageDimensionsFromBuffer(buffer);
    if (fromHeader?.width && fromHeader?.height) {
      const reconciled = reconcileDimensionsWithFilename(fileName, buildDimensionResult(fromHeader.width, fromHeader.height, {
        source: "file_metadata",
        format: fromHeader.format,
        exifOrientation: fromHeader.exifOrientation,
        storedWidth: fromHeader.storedWidth,
        storedHeight: fromHeader.storedHeight,
      }));
      return reconciled;
    }

    if (blob.size > headerBytes) {
      const fullBuffer = await blob.arrayBuffer();
      const fromFullFile = readImageDimensionsFromBuffer(fullBuffer);
      if (fromFullFile?.width && fromFullFile?.height) {
        const reconciled = reconcileDimensionsWithFilename(fileName, buildDimensionResult(fromFullFile.width, fromFullFile.height, {
          source: "file_metadata",
          format: fromFullFile.format,
          exifOrientation: fromFullFile.exifOrientation,
          storedWidth: fromFullFile.storedWidth,
          storedHeight: fromFullFile.storedHeight,
        }));
        return reconciled;
      }
    }
  } catch {
    // Fall through to bitmap decode.
  }

  const fromBitmap = await readImageDimensionsViaBitmap(blob);
  if (fromBitmap) {
    return reconcileDimensionsWithFilename(fileName, fromBitmap);
  }

  throw new Error("Could not read image dimensions from file.");
}

export function formatCreativeSize(width, height) {
  return buildDimensionResult(width, height).size;
}

/** @deprecated Use matchPlatformSupportedSize in creativeValidation for compatibility checks only. */
export function normalizeCreativeDimensions(width, height) {
  return buildDimensionResult(width, height);
}
