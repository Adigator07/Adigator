export type CampaignGoal = "awareness" | "consideration" | "conversion";

export type VerticalKey =
  | "automotive"
  | "banking"
  | "ecommerce"
  | "education"
  | "entertainment"
  | "finance"
  | "food"
  | "gaming"
  | "healthcare"
  | "hotels"
  | "luxury"
  | "news_media"
  | "real_estate"
  | "sports"
  | "technology"
  | "travel";

export type IntelligenceProfileKey = `${CampaignGoal}:${VerticalKey}`;

export type Priority = "low" | "medium" | "high" | "critical";

export type CtaStrength = "none" | "soft" | "medium" | "direct";

export type LayoutDensity = "minimal" | "balanced" | "information-rich" | "direct-response";

export type ReadingPattern = "z-pattern" | "f-pattern" | "center-focus" | "feed-scan" | "hero-first";

export interface DatasetSource {
  goal: CampaignGoal;
  path: string;
  status: "empty" | "seeded" | "parsed";
}

export interface EmotionExpectation {
  primary: string[];
  secondary: string[];
  avoid: string[];
  intensity: "subtle" | "moderate" | "high";
}

export interface CtaExpectation {
  strength: CtaStrength;
  examples: string[];
  discouraged: string[];
  required: boolean;
  visibilityPriority: Priority;
}

export interface LayoutExpectation {
  density: LayoutDensity;
  readingPattern: ReadingPattern;
  preferredHierarchy: string[];
  whitespace: "generous" | "moderate" | "compact";
  safeAreaRules: string[];
}

export interface ScoringPreferences {
  weights: {
    brandRecall: number;
    ctaClarity: number;
    emotionalResonance: number;
    trustSignals: number;
    visualClarity: number;
    offerClarity: number;
    mobileLegibility: number;
  };
  penalties: string[];
  boosts: string[];
}

export interface CreativeBehaviorRule {
  id: string;
  description: string;
  priority: Priority;
  positiveSignals: string[];
  negativeSignals: string[];
}

export interface MobilePreferences {
  minimumTextSize: "small" | "medium" | "large";
  thumbZoneCta: boolean;
  maxMessageUnits: number;
  preferredFormats: string[];
  rules: string[];
}

export interface DesignPsychologyRule {
  id: string;
  principle: string;
  recommendation: string;
  appliesTo: Array<CampaignGoal | VerticalKey>;
}

export interface VisualPsychology {
  energy: "low" | "medium" | "high";
  colorPalette: {
    primary: string[];
    secondary: string[];
    avoid: string[];
  };
  typographyStyle: "minimal" | "moderate" | "bold";
  brandingProminence: "subtle" | "balanced" | "dominant";
}

export interface TrustExpectation {
  trustSignalsRequired: boolean;
  credibilityIndicators: string[];
  averageConfidence: number;
}

export interface IntelligenceProfile {
  key: IntelligenceProfileKey;
  goal: CampaignGoal;
  vertical: VerticalKey;
  label: string;
  source: DatasetSource[];
  expectedEmotions: EmotionExpectation;
  ctaExpectations: CtaExpectation;
  layoutExpectations: LayoutExpectation;
  scoringPreferences: ScoringPreferences;
  creativeBehaviors: CreativeBehaviorRule[];
  emotionalTriggers: string[];
  mobilePreferences: MobilePreferences;
  designPsychologyRules: DesignPsychologyRule[];
  visualPsychology?: VisualPsychology;
  trustExpectations?: TrustExpectation;
  conversionPressure?: "low" | "medium" | "high" | "critical";
  notes: string[];
}

export type IntelligenceProfilePatch = Partial<
  Omit<IntelligenceProfile, "key" | "goal" | "vertical" | "label" | "source">
> & {
  label?: string;
  source?: DatasetSource[];
};

export interface ProfileLookupInput {
  campaignGoal: string;
  vertical: string;
}
