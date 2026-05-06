export interface ConfidenceInput {
  ctaDetected: boolean;
  textClarityGood: boolean;
  imageQualityGood: boolean;
  contrastGood: boolean;
  layoutGood: boolean;
}

export function computeSignalConfidence(input: ConfidenceInput): number {
  const signals = [
    input.ctaDetected,
    input.textClarityGood,
    input.imageQualityGood,
    input.contrastGood,
    input.layoutGood,
  ];

  const detectedSignals = signals.filter(Boolean).length;
  const totalSignals = signals.length;

  return Math.round((detectedSignals / totalSignals) * 100);
}
