import { captureDomToCanvas } from "@/app/lib/domCapture";

const chromeCache = new Map();

function pickRecorderMimeType() {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ];
  if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported) {
    return "";
  }
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

function waitForEvent(target, eventName, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error(`Timed out waiting for ${eventName}.`));
    }, timeoutMs);
    const onEvent = () => {
      cleanup();
      resolve();
    };
    const cleanup = () => {
      window.clearTimeout(timer);
      target.removeEventListener(eventName, onEvent);
    };
    target.addEventListener(eventName, onEvent, { once: true });
  });
}

async function waitForVideoReady(video) {
  if (video.readyState >= 2) return;
  await Promise.race([
    waitForEvent(video, "loadeddata"),
    waitForEvent(video, "canplay"),
  ]);
}

function isPreviewVideoNode(node) {
  if (!node || node.nodeType !== 1) return false;
  return (
    node.tagName === "VIDEO"
    || node.getAttribute?.("data-preview-video") === "true"
    || Boolean(node.closest?.("[data-preview-video='true']"))
  );
}

function drawCoverOrContain(ctx, video, x, y, w, h, fit = "contain") {
  const vw = video.videoWidth || w;
  const vh = video.videoHeight || h;
  if (!vw || !vh) {
    ctx.drawImage(video, x, y, w, h);
    return;
  }
  const scale = fit === "cover"
    ? Math.max(w / vw, h / vh)
    : Math.min(w / vw, h / vh);
  const dw = vw * scale;
  const dh = vh * scale;
  const dx = x + (w - dw) / 2;
  const dy = y + (h - dh) / 2;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = "#000";
  ctx.fillRect(x, y, w, h);
  ctx.drawImage(video, dx, dy, dw, dh);
  ctx.restore();
}

async function createDetachedVideo(liveVideo) {
  const src = liveVideo.currentSrc || liveVideo.src;
  if (!src) throw new Error("Preview video has no source.");

  const clone = document.createElement("video");
  clone.src = src;
  if (!src.startsWith("blob:") && !src.startsWith("data:")) {
    clone.crossOrigin = liveVideo.crossOrigin || "anonymous";
  }
  clone.preload = "auto";
  clone.playsInline = true;
  clone.muted = true;
  clone.loop = false;
  clone.style.position = "fixed";
  clone.style.left = "-10000px";
  clone.style.top = "0";
  clone.style.width = "1px";
  clone.style.height = "1px";
  clone.style.opacity = "0";
  clone.setAttribute("aria-hidden", "true");
  document.body.appendChild(clone);

  try {
    clone.load();
    await waitForVideoReady(clone);
  } catch (error) {
    clone.remove();
    throw error;
  }

  return clone;
}

function buildChromeCacheKey(previewElement, width, height) {
  const placement = previewElement.getAttribute("data-export-capture-root") != null
    ? "root"
    : "node";
  return `${placement}|${Math.round(width)}x${Math.round(height)}|${previewElement.querySelector("[data-preview-video]")?.src || ""}`;
}

/**
 * Record Preview Studio as a short, smooth video (template chrome + creative + audio).
 * Uses an off-DOM decode pipeline so the on-screen preview never glitches.
 */
export async function recordPreviewStudioVideo({
  previewElement,
  filename = "Preview_Studio.webm",
  maxDurationSeconds = 6,
  fps = 30,
} = {}) {
  if (!previewElement) {
    throw new Error("Preview template is not ready to record.");
  }
  if (typeof MediaRecorder === "undefined" || typeof HTMLCanvasElement === "undefined") {
    throw new Error("Video recording is not supported in this browser.");
  }

  const liveVideo = previewElement.querySelector("video");
  if (!liveVideo) {
    throw new Error("No video creative found in the current preview template.");
  }

  await waitForVideoReady(liveVideo);

  const rootRect = previewElement.getBoundingClientRect();
  const videoRect = liveVideo.getBoundingClientRect();
  if (rootRect.width < 8 || rootRect.height < 8) {
    throw new Error("Preview template has no measurable size.");
  }

  // 1x scale keeps export fast while remaining sharp on the recorded canvas size.
  const scale = 1;
  const canvasWidth = Math.max(2, Math.round(rootRect.width * scale));
  const canvasHeight = Math.max(2, Math.round(rootRect.height * scale));

  const cacheKey = buildChromeCacheKey(previewElement, canvasWidth, canvasHeight);
  let chromeShot = chromeCache.get(cacheKey) || null;

  if (!chromeShot) {
    chromeShot = await captureDomToCanvas(previewElement, {
      scale,
      backgroundColor: "#0b1020",
      logging: false,
      // Skip live <video> paint — we composite frames from a detached decoder instead.
      ignoreElements: isPreviewVideoNode,
    });
    if (chromeCache.size > 8) {
      const oldest = chromeCache.keys().next().value;
      chromeCache.delete(oldest);
    }
    chromeCache.set(cacheKey, chromeShot);
  }

  const vx = Math.max(0, (videoRect.left - rootRect.left) * scale);
  const vy = Math.max(0, (videoRect.top - rootRect.top) * scale);
  const vw = Math.max(2, videoRect.width * scale);
  const vh = Math.max(2, videoRect.height * scale);
  const fit = liveVideo.classList.contains("object-cover") ? "cover" : "contain";

  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
  if (!ctx) throw new Error("Could not create recording canvas.");

  const source = await createDetachedVideo(liveVideo);
  const knownDuration = Number.isFinite(source.duration) && source.duration > 0
    ? source.duration
    : (Number.isFinite(liveVideo.duration) && liveVideo.duration > 0 ? liveVideo.duration : maxDurationSeconds);
  const duration = Math.min(Math.max(1.5, knownDuration), maxDurationSeconds);

  source.currentTime = 0;
  // Download click is a user gesture — unmute for a proper audio track in the file.
  source.muted = false;
  source.volume = 1;
  try {
    await source.play();
  } catch {
    source.muted = true;
    await source.play().catch(() => undefined);
  }

  const canvasStream = canvas.captureStream(fps);
  let audioTracks = [];
  try {
    const mediaStream = typeof source.captureStream === "function"
      ? source.captureStream()
      : (typeof source.mozCaptureStream === "function" ? source.mozCaptureStream() : null);
    audioTracks = mediaStream?.getAudioTracks?.() || [];
    audioTracks.forEach((track) => canvasStream.addTrack(track));
  } catch {
    // Video-only export is still useful if audio capture fails.
  }

  const mimeType = pickRecorderMimeType();
  const recorderOptions = {
    videoBitsPerSecond: 8_000_000,
  };
  if (mimeType) recorderOptions.mimeType = mimeType;
  if (audioTracks.length) recorderOptions.audioBitsPerSecond = 192_000;

  const recorder = new MediaRecorder(canvasStream, recorderOptions);

  const chunks = [];
  recorder.ondataavailable = (event) => {
    if (event.data && event.data.size > 0) chunks.push(event.data);
  };

  const drawFrame = () => {
    ctx.drawImage(chromeShot, 0, 0, canvasWidth, canvasHeight);
    try {
      drawCoverOrContain(ctx, source, vx, vy, vw, vh, fit);
    } catch {
      // Keep last good chrome frame on decode races.
    }
  };

  drawFrame();
  recorder.start(250);

  await new Promise((resolve, reject) => {
    let stopped = false;
    let frameHandle = 0;
    let usingRvfc = typeof source.requestVideoFrameCallback === "function";

    const cleanupSource = () => {
      try {
        source.pause();
      } catch {
        // ignore
      }
      source.removeAttribute("src");
      source.load();
      source.remove();
    };

    const finish = () => {
      if (stopped) return;
      stopped = true;
      if (usingRvfc && typeof source.cancelVideoFrameCallback === "function") {
        try {
          source.cancelVideoFrameCallback(frameHandle);
        } catch {
          // ignore
        }
      } else {
        cancelAnimationFrame(frameHandle);
      }
      try {
        if (recorder.state !== "inactive") recorder.stop();
      } catch (error) {
        cleanupSource();
        reject(error);
      }
    };

    recorder.onerror = () => {
      finish();
      cleanupSource();
      reject(new Error("Preview recording failed."));
    };

    recorder.onstop = () => {
      canvasStream.getTracks().forEach((track) => track.stop());
      audioTracks.forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      cleanupSource();
      resolve();
    };

    const tick = () => {
      if (stopped) return;
      drawFrame();
      if (source.ended || source.currentTime >= duration - 0.04) {
        finish();
        return;
      }
      if (usingRvfc) {
        frameHandle = source.requestVideoFrameCallback(tick);
      } else {
        frameHandle = requestAnimationFrame(tick);
      }
    };

    if (usingRvfc) {
      frameHandle = source.requestVideoFrameCallback(tick);
    } else {
      frameHandle = requestAnimationFrame(tick);
    }

    window.setTimeout(finish, (duration + 0.35) * 1000);
  });

  const blob = new Blob(chunks, { type: recorder.mimeType || "video/webm" });
  if (!blob.size) {
    throw new Error("Recording produced an empty file. Try again.");
  }

  const extension = blob.type.includes("mp4") ? "mp4" : "webm";
  const safeName = String(filename || "Preview_Studio")
    .replace(/\.(pdf|pptx|png|jpg|jpeg|webm|mp4)$/i, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "_");

  return {
    blob,
    filename: `${safeName}.${extension}`,
    mimeType: blob.type,
    durationSeconds: duration,
  };
}
