/**
 * Preview Engine — Type Contracts
 * Shared across API route, engine logic, and React components.
 */

export type EnvironmentFamily =
  | "news"
  | "commerce"
  | "social"
  | "luxury"
  | "sports"
  | "gaming"
  | "finance"
  | "travel"
  | "booking";

export type DeviceType = "desktop" | "tablet" | "mobile";

export type SlotType =
  | "inline"
  | "sidebar"
  | "sticky"
  | "feed-card"
  | "interstitial"
  | "product-tile"
  | "native-recommendation"
  | "dashboard-module"
  | "leaderboard"
  | "banner";

export interface ContentBlock {
  type:
    | "headline"
    | "body"
    | "byline"
    | "label"
    | "stat"
    | "card"
    | "list-item"
    | "price"
    | "meta"
    | "score";
  text: string;
  secondary?: string;
  meta?: Record<string, string | number>;
}

export interface UIModule {
  type:
    | "nav"
    | "sidebar-widget"
    | "trending"
    | "product-grid"
    | "score-card"
    | "feed-post"
    | "kpi-card"
    | "search-bar"
    | "filter"
    | "tag-list"
    | "ticker";
  label?: string;
  items?: ContentBlock[];
  data?: Record<string, unknown>;
}

export interface LandingHeroSection {
  headline: string;
  subheadline: string;
  primaryCta: string;
  secondaryCta: string;
  supportingBullets: string[];
  trustIndicators: string[];
}

export interface LandingFeatureBlock {
  title: string;
  description: string;
  iconIdea: string;
}

export interface LandingSocialProofItem {
  quote: string;
  name: string;
  role: string;
}

export interface LandingHowItWorksStep {
  title: string;
  description: string;
}

export interface LandingPageContent {
  hero: LandingHeroSection;
  valueProposition: {
    sectionTitle: string;
    features: LandingFeatureBlock[];
  };
  socialProof: {
    testimonials: LandingSocialProofItem[];
    ratingSummary: string;
    trustStatement: string;
  };
  offerPromotion: {
    headline: string;
    explanation: string;
    urgency: string;
    ctaText: string;
  };
  howItWorks: LandingHowItWorksStep[];
  benefits: string[];
  finalConversion: {
    headline: string;
    valueStatement: string;
    ctaText: string;
  };
  footer: {
    companyDescription: string;
    navigationLinks: string[];
    legalMessaging: string;
  };
}

export interface GeneratedEnvironment {
  layoutType: string;
  pageTitle: string;
  publisherName?: string;
  contextBlocks: ContentBlock[];
  uiModules: UIModule[];
  landingPage?: LandingPageContent;
}

export interface PreviewDecision {
  environment: EnvironmentFamily;
  primaryTemplate: string;
  fallbackTemplates: string[];
  device: DeviceType;
  reason: string;
}

export interface CreativeAnalysis {
  creativeType: string;
  creativeSize: string;
  detectedElements: string[];
  riskFlags: string[];
}

export interface CreativeMapping {
  placementType: string;
  slotType: SlotType;
  slotDescription: string;
  injectionNotes: string;
}

export interface ResponsiveState {
  device: DeviceType;
  frameSize: string;
  notes: string;
}

export interface ValidationResult {
  ctaVisibility: "pass" | "fail" | "warn";
  logoVisibility: "pass" | "fail" | "warn";
  textOverflow: "pass" | "fail" | "warn";
  croppingRisk: "pass" | "fail" | "warn";
  contextFit: "pass" | "fail" | "warn";
  overallStatus: "pass" | "fail" | "warning";
}

export interface CompatibilityCheck {
  deviceFit: "pass" | "fail" | "warn";
  message: string;
  suggestedSizes: string[];
}

export interface PreviewEngineOutput {
  previewDecision: PreviewDecision;
  generatedEnvironment: GeneratedEnvironment;
  creativeAnalysis: CreativeAnalysis;
  creativeMapping: CreativeMapping;
  responsiveStates: ResponsiveState[];
  validation: ValidationResult;
  compatibility: CompatibilityCheck;
  recommendations: string[];
  exportTargets: string[];
}

export interface PreviewEngineInput {
  vertical: string;
  goal:
    | "awareness"
    | "traffic"
    | "conversion"
    | "lead_generation"
    | "engagement"
    | "app_installs"
    | "video_views"
    | "retargeting"
    | "consideration";
  preferredEnvironment?: EnvironmentFamily;
  device?: DeviceType;
  creativeSize?: string;
  creativeType?: string;
  analyzerOutput?: Record<string, unknown>;
  ctaText?: string;
  headline?: string;
  logoPresent?: boolean;
  riskFlags?: string[];
}
