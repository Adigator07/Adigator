export type HealthCatalogCampaign = {
  id: string;
  name: string;
  status: string;
  channelType: string;
  budgetAmountMicros: number;
  customerId: string;
  loginCustomerId?: string;
};

export type HealthCatalogAccount = {
  customerId: string;
  name: string;
  manager?: boolean;
  loginCustomerId?: string;
  campaigns: HealthCatalogCampaign[];
};

export const HEALTH_INTERVALS = [
  { id: "15", minutes: 15, label: "Every 15 minutes (near real-time)" },
  { id: "60", minutes: 60, label: "Hourly" },
  { id: "360", minutes: 360, label: "Every 6 hours" },
  { id: "1440", minutes: 1440, label: "Daily" },
] as const;

export type HealthIssueCategory =
  | "budget"
  | "status"
  | "conversions"
  | "ads"
  | "tracking"
  | "landing_page"
  | "policy"
  | "settings";

export type HealthSeverity = "critical" | "high" | "medium" | "low";

export type CampaignHealthIssue = {
  id: string;
  category: HealthIssueCategory;
  severity: HealthSeverity;
  title: string;
  detail: string;
  recommendation: string;
  steps: string[];
};

export type CampaignHealthSnapshot = {
  campaignId: string;
  campaignName: string;
  customerId: string;
  accountName?: string;
  status: string;
  primaryStatus: string;
  primaryStatusReasons: string[];
  channelType: string;
  budgetAmountMicros: number;
  impressions7d: number;
  clicks7d: number;
  conversions7d: number;
  costMicros7d: number;
  conversionsYesterday: number;
  costMicrosYesterday: number;
  enabledAdCount: number;
  disapprovedAdCount: number;
  limitedAdCount: number;
  underReviewAdCount: number;
  conversionTrackingStatus: string;
  landingUrls: string[];
  landingPageErrors: Array<{ url: string; error: string }>;
  checkedAt: string;
};

export type CampaignHealthReport = {
  monitorId: string;
  score: number;
  grade: "healthy" | "watch" | "at_risk" | "critical";
  categoryScores: Record<HealthIssueCategory, number>;
  issues: CampaignHealthIssue[];
  recommendations: Array<{ title: string; detail: string; steps: string[] }>;
  snapshot: CampaignHealthSnapshot;
};

export type CampaignHealthMonitor = {
  id: string;
  customerId: string;
  loginCustomerId?: string;
  accountName: string;
  campaignId: string;
  campaignName: string;
  channelType?: string;
  status?: string;
  enabled: boolean;
  lastScore: number | null;
  lastGrade: CampaignHealthReport["grade"] | null;
  lastCheckedAt: string | null;
  lastIssueIds: string[];
};

export type CampaignHealthAlert = {
  id: string;
  monitorId: string;
  campaignName: string;
  severity: HealthSeverity;
  title: string;
  detail: string;
  recommendation: string;
  createdAt: string;
  acknowledged: boolean;
};

export type CampaignHealthAuditEntry = {
  id: string;
  monitorId?: string;
  campaignName?: string;
  event: "monitor_added" | "monitor_removed" | "check_completed" | "issue_opened" | "issue_resolved" | "interval_changed";
  summary: string;
  createdAt: string;
};

export type CampaignHealthWorkspace = {
  ownerId: string;
  intervalMinutes: number;
  notifyInWorkspace: boolean;
  monitors: CampaignHealthMonitor[];
  alerts: CampaignHealthAlert[];
  audit: CampaignHealthAuditEntry[];
  reports: Record<string, CampaignHealthReport>;
  updatedAt: string;
};
