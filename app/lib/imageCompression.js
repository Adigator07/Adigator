/**
 * Client-side image compression tuned for Adigator upload/validate flows.
 * Goals: fewer canvas encodes, reused canvas, early exit, UI yields between jobs.
 */

const DEFAULT_OUTPUT_TYPE = "image/jpeg";

let sharedCanvas = null;
let sharedCtx = null;

function getSharedCanvas(width, height) {
  if (typeof document === "undefined") {
    throw new Error("Canvas compression is only available in the browser.");
  }
  if (!sharedCanvas) {
    sharedCanvas = document.createElement("canvas");
    sharedCtx = sharedCanvas.getContext("2d", {
      alpha: false,
      desynchronized: true,
    });
  }
  sharedCanvas.width = width;
  sharedCanvas.height = height;
  if (!sharedCtx) {
    throw new Error("Could not initialize canvas context for compression.");
  }
  return { canvas: sharedCanvas, ctx: sharedCtx };
}

export function yieldToMain() {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => resolve());
    } else {
      setTimeout(resolve, 0);
    }
  });
}

export async function mapWithConcurrency(items, concurrency, mapper) {
  if (!items.length) return [];
  const results = new Array(items.length);
  let nextIndex = 0;
  const workerCount = Math.min(Math.max(1, concurrency), items.length);

  const worker = async () => {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) break;
      results[index] = await mapper(items[index], index);
      await yieldToMain();
    }
  };

  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

export function loadImageFromDataURL(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not parse image dimensions"));
    img.src = dataUrl;
  });
}

/** Prefer ImageBitmap for decode performance when source is a File/Blob. */
export async function loadImageSource(source) {
  if (source instanceof Blob) {
    let bitmap;
    try {
      bitmap = await createImageBitmap(source, { imageOrientation: "from-image" });
    } catch {
      bitmap = await createImageBitmap(source);
    }
    return {
      drawable: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      release: () => {
        if (typeof bitmap.close === "function") bitmap.close();
      },
    };
  }

  const img = await loadImageFromDataURL(source);
  return {
    drawable: img,
    width: img.width,
    height: img.height,
    release: () => {},
  };
}

export function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result);
    reader.onerror = () => reject(new Error("Could not serialize compressed image."));
    reader.readAsDataURL(blob);
  });
}

export function getFileExtensionForMime(mimeType) {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/gif") return "gif";
  if (mimeType === "image/webp") return "webp";
  return "jpg";
}

function encodeDrawable(drawable, width, height, outputType, quality) {
  const { ctx } = getSharedCanvas(width, height);
  ctx.drawImage(drawable, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    sharedCanvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Compression failed while encoding image."));
          return;
        }
        resolve(blob);
      },
      outputType,
      quality,
    );
  });
}

export async function compressDrawable(drawable, options = {}) {
  const {
    outputType = DEFAULT_OUTPUT_TYPE,
    quality = 0.78,
    scale = 1,
    sourceWidth,
    sourceHeight,
    includeDataUrl = true,
  } = options;

  const baseWidth = sourceWidth || drawable.width;
  const baseHeight = sourceHeight || drawable.height;
  const safeScale = Math.min(Math.max(Number(scale) || 1, 0.1), 1);
  const targetWidth = Math.max(1, Math.round(baseWidth * safeScale));
  const targetHeight = Math.max(1, Math.round(baseHeight * safeScale));

  const blob = await encodeDrawable(drawable, targetWidth, targetHeight, outputType, quality);
  const dataUrl = includeDataUrl ? await blobToDataURL(blob) : null;

  return {
    dataUrl,
    blob,
    width: targetWidth,
    height: targetHeight,
    quality,
    scale: safeScale,
  };
}

export function pickBetterCandidate(current, next, targetBytes) {
  if (!current) return next;
  if (!targetBytes) return next.blob.size < current.blob.size ? next : current;

  const currentUnder = current.blob.size <= targetBytes;
  const nextUnder = next.blob.size <= targetBytes;

  if (currentUnder && nextUnder) {
    return next.blob.size > current.blob.size ? next : current;
  }
  if (nextUnder && !currentUnder) return next;
  if (!nextUnder && currentUnder) return current;

  return next.blob.size < current.blob.size ? next : current;
}

function buildScaleAttempts(sourceWidth, sourceHeight, targetBytes) {
  if (!targetBytes) return [1];

  const pixelCount = Math.max(1, sourceWidth * sourceHeight);
  const roughBytesPerPixel = 0.12;
  const estimatedAtFullQuality = pixelCount * roughBytesPerPixel;
  const ratio = targetBytes / estimatedAtFullQuality;
  const estimatedScale = Math.min(1, Math.max(0.3, Math.sqrt(ratio)));

  const candidates = [
    estimatedScale,
    estimatedScale * 0.88,
    estimatedScale * 0.75,
    0.55,
    0.45,
  ]
    .map((value) => Number(Math.min(1, Math.max(0.3, value)).toFixed(2)))
    .filter((value, index, list) => list.indexOf(value) === index);

  return candidates.sort((a, b) => b - a);
}

/**
 * Compress with far fewer encode attempts than nested scale × quality loops.
 */
export async function compressImageToTarget(drawable, options = {}) {
  const {
    outputType = DEFAULT_OUTPUT_TYPE,
    targetBytes = null,
    sourceWidth,
    sourceHeight,
    maxQualityIterations = 5,
  } = options;

  const width = sourceWidth || drawable.width;
  const height = sourceHeight || drawable.height;

  if (!targetBytes) {
    return compressDrawable(drawable, {
      outputType,
      quality: 0.82,
      scale: 1,
      sourceWidth: width,
      sourceHeight: height,
      includeDataUrl: true,
    });
  }

  const scaleAttempts = buildScaleAttempts(width, height, targetBytes);

  let bestCandidate = null;

  for (const scale of scaleAttempts) {
    let low = 0.38;
    let high = 0.92;
    let localBest = null;

    for (let iteration = 0; iteration < maxQualityIterations; iteration += 1) {
      const quality = Number(((low + high) / 2).toFixed(3));
      const compressed = await compressDrawable(drawable, {
        outputType,
        quality,
        scale,
        sourceWidth: width,
        sourceHeight: height,
        includeDataUrl: false,
      });

      const candidate = { ...compressed, quality, scale };
      localBest = pickBetterCandidate(localBest, candidate, targetBytes);

      if (!targetBytes) break;

      if (compressed.blob.size > targetBytes) {
        high = quality - 0.025;
      } else {
        low = quality + 0.025;
        if (compressed.blob.size >= targetBytes * 0.94) break;
      }
    }

    if (localBest) {
      bestCandidate = pickBetterCandidate(bestCandidate, localBest, targetBytes);
      if (targetBytes && localBest.blob.size <= targetBytes && scale >= 0.5) {
        break;
      }
    }

    await yieldToMain();
  }

  if (!bestCandidate) {
    throw new Error("Compression attempt did not produce a usable result.");
  }

  return {
    ...bestCandidate,
    dataUrl: await blobToDataURL(bestCandidate.blob),
  };
}

export function padBlobToExactBytes(blob, targetBytes) {
  const safeTarget = Number(targetBytes);
  if (!Number.isFinite(safeTarget) || safeTarget <= 0 || blob.size >= safeTarget) {
    return blob;
  }

  const padding = new Uint8Array(safeTarget - blob.size);
  return new Blob([blob, padding], { type: blob.type || DEFAULT_OUTPUT_TYPE });
}

/** @deprecated Use compressDrawable — kept for compatibility */
export async function compressImageDataURL(dataUrl, options = {}) {
  const { sourceImage, ...rest } = options;
  const drawable = sourceImage || (await loadImageFromDataURL(dataUrl));
  return compressDrawable(drawable, rest);
}
