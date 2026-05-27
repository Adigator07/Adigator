/**
 * Scale large platform environments to fit preview cards.
 */

export function calculateScale(containerWidth, naturalWidth, naturalHeight, containerHeight = null) {
  if (!containerWidth || !naturalWidth) return 1;
  const scaleX = containerWidth / naturalWidth;
  if (!naturalHeight) return Math.min(scaleX, 1);
  const scaleY = containerHeight ? containerHeight / naturalHeight : scaleX;
  return Math.min(scaleX, scaleY, 1);
}

export function getScaledDimensions(naturalWidth, naturalHeight, scale) {
  return {
    width: naturalWidth,
    height: naturalHeight,
    scale,
    displayWidth: naturalWidth * scale,
    displayHeight: naturalHeight * scale,
  };
}

export function formatScaleLabel(scale) {
  if (!scale || scale >= 0.995) return null;
  return `Scaled ${Math.round(scale * 100)}%`;
}
