/**
 * Browser-only video metadata and key-frame extraction for Meta/Google video analysis.
 */

const VIDEO_MIME_TYPES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
]);

export function isVideoFile(file) {
  if (!file) return false;
  const mime = String(file.type || "").toLowerCase();
  if (VIDEO_MIME_TYPES.has(mime)) return true;
  const name = String(file.name || "").toLowerCase();
  return [".mp4", ".mov", ".webm"].some((ext) => name.endsWith(ext));
}

export function filterMediaFiles(files, { allowVideo = false } = {}) {
  const list = Array.from(files || []);
  return list.filter((file) => {
    if (!file) return false;
    if (file.type?.startsWith("image/")) return true;
    if (allowVideo && isVideoFile(file)) return true;
    return false;
  });
}

function loadVideoElement(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    const cleanup = () => {
      URL.revokeObjectURL(url);
      video.removeAttribute("src");
      video.load();
    };

    video.onloadedmetadata = () => resolve({ video, cleanup });
    video.onerror = () => {
      cleanup();
      reject(new Error(`Could not read video metadata for ${file.name}.`));
    };
    video.src = url;
  });
}

/**
 * Best-effort audio-track detection. Browsers expose this inconsistently, so we probe
 * several vendor properties. Returns `true`/`false` when confident, or `null` when unknown
 * (validation treats unknown audio as "no warning").
 */
function detectHasAudio(video) {
  if (typeof video.mozHasAudio === "boolean") return video.mozHasAudio;
  if (typeof video.webkitAudioDecodedByteCount === "number") {
    return video.webkitAudioDecodedByteCount > 0;
  }
  if (video.audioTracks && typeof video.audioTracks.length === "number") {
    return video.audioTracks.length > 0;
  }
  return null;
}

/**
 * Best-effort frame-rate estimate via requestVideoFrameCallback over a short muted window.
 * Returns fps rounded to 3dp, or `null` when the API is unavailable (validation skips FPS).
 */
function estimateFrameRate(video) {
  return new Promise((resolve) => {
    if (typeof video.requestVideoFrameCallback !== "function") {
      resolve(null);
      return;
    }
    let firstMediaTime = null;
    let firstPresentedFrames = null;
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      try { video.pause(); } catch { /* ignore */ }
      resolve(value);
    };

    const onFrame = (_now, metadata) => {
      if (firstMediaTime === null) {
        firstMediaTime = metadata.mediaTime;
        firstPresentedFrames = metadata.presentedFrames;
        video.requestVideoFrameCallback(onFrame);
        return;
      }
      const deltaTime = metadata.mediaTime - firstMediaTime;
      const deltaFrames = metadata.presentedFrames - firstPresentedFrames;
      if (deltaTime > 0.25 && deltaFrames > 0) {
        finish(Math.round((deltaFrames / deltaTime) * 1000) / 1000);
        return;
      }
      video.requestVideoFrameCallback(onFrame);
    };

    video.requestVideoFrameCallback(onFrame);
    const playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => finish(null));
    }
    // Hard timeout so uploads never hang on frame-rate probing.
    setTimeout(() => finish(null), 1200);
  });
}

export async function readVideoMetadataFromBlob(file) {
  const { video, cleanup } = await loadVideoElement(file);
  try {
    const rawWidth = Math.round(video.videoWidth || 0);
    const rawHeight = Math.round(video.videoHeight || 0);
    const rawDuration = video.duration;
    // A readable video must report positive dimensions and a finite, positive duration.
    const readable =
      rawWidth > 0 && rawHeight > 0 && Number.isFinite(rawDuration) && rawDuration > 0;

    const width = Math.max(1, rawWidth);
    const height = Math.max(1, rawHeight);
    const duration = Number.isFinite(rawDuration) ? rawDuration : 0;

    let frameRate = null;
    if (readable) {
      try {
        frameRate = await estimateFrameRate(video);
      } catch {
        frameRate = null;
      }
    }

    return {
      width,
      height,
      duration,
      readable,
      frameRate,
      aspectRatio: width && height ? width / height : null,
      orientation: width >= height ? (width === height ? "square" : "landscape") : "portrait",
      mimeType: file.type || "video/mp4",
      fileName: file.name || "",
      fileSizeBytes: file.size,
      hasAudio: detectHasAudio(video),
    };
  } catch {
    // Element failed to decode metadata → treat as corrupted/unreadable.
    return {
      width: 0,
      height: 0,
      duration: 0,
      readable: false,
      frameRate: null,
      aspectRatio: null,
      orientation: "unknown",
      mimeType: file.type || "video/mp4",
      fileName: file.name || "",
      fileSizeBytes: file.size,
      hasAudio: null,
    };
  } finally {
    cleanup();
  }
}

function seekVideo(video, time) {
  return new Promise((resolve, reject) => {
    const onSeeked = () => {
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      resolve();
    };
    const onError = () => {
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
      reject(new Error("Failed to seek video frame."));
    };
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("error", onError);
    video.currentTime = Math.min(Math.max(time, 0), Math.max(video.duration - 0.05, 0));
  });
}

function captureFrame(video, maxWidth = 1280, maxHeight = 720) {
  const sourceWidth = video.videoWidth || 1;
  const sourceHeight = video.videoHeight || 1;
  const scale = Math.min(1, maxWidth / sourceWidth, maxHeight / sourceHeight);
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable for frame extraction.");
  ctx.drawImage(video, 0, 0, width, height);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to capture video frame."));
          return;
        }
        resolve({ blob, width, height });
      },
      "image/jpeg",
      0.82,
    );
  });
}

/** Capture a single poster frame from a video for use as a thumbnail/preview. */
export async function createVideoPreviewBlob(file, { maxEdge = 420 } = {}) {
  const { video, cleanup } = await loadVideoElement(file);
  try {
    const duration = Math.max(video.duration || 0, 0);
    // Grab a frame ~10% in (fall back to the very start for tiny clips).
    const target = duration > 0.2 ? Math.min(duration * 0.1, 1) : 0;
    await seekVideo(video, target);
    const captured = await captureFrame(video, maxEdge, maxEdge);
    return captured.blob;
  } finally {
    cleanup();
  }
}

export async function extractVideoKeyFrames(file, options = {}) {
  const intervalSeconds = options.intervalSeconds ?? 2.5;
  const maxFrames = options.maxFrames ?? 15;
  const maxWidth = options.maxWidth ?? 1280;
  const maxHeight = options.maxHeight ?? 720;

  const { video, cleanup } = await loadVideoElement(file);
  const frames = [];

  try {
    const duration = Math.max(video.duration || 0, 0.1);
    const sampleCount = Math.min(maxFrames, Math.max(1, Math.ceil(duration / intervalSeconds)));
    const times = Array.from({ length: sampleCount }, (_, index) => {
      if (sampleCount === 1) return 0;
      return (duration * index) / (sampleCount - 1);
    });

    for (const time of times) {
      await seekVideo(video, time);
      const captured = await captureFrame(video, maxWidth, maxHeight);
      const mm = Math.floor(time / 60);
      const ss = Math.floor(time % 60);
      frames.push({
        timeSeconds: time,
        timeLabel: `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`,
        blob: captured.blob,
        width: captured.width,
        height: captured.height,
      });
    }

    return frames;
  } finally {
    cleanup();
  }
}
