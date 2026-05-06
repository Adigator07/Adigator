export type ValidationAlertType = "warning" | "error";

export interface ValidationAlert {
  type: ValidationAlertType;
  message: string;
}

export interface ValidationInput {
  fileSizeKB: number;
  size: string;
  supportedSizes: string[];
  isBlurry: boolean;
  contrast: number;
}

export function buildValidationAlerts(input: ValidationInput): ValidationAlert[] {
  const alerts: ValidationAlert[] = [];

  if (input.fileSizeKB > 150) {
    alerts.push({
      type: "warning",
      message: "File size exceeds 150KB",
    });
  }

  if (input.supportedSizes.length > 0 && !input.supportedSizes.includes(input.size)) {
    alerts.push({
      type: "error",
      message: "Unsupported ad size",
    });
  }

  if (input.isBlurry) {
    alerts.push({
      type: "warning",
      message: "Creative appears blurry or low-definition",
    });
  }

  if (input.contrast < 30) {
    alerts.push({
      type: "warning",
      message: "Contrast is too low for reliable readability",
    });
  }

  return alerts;
}
