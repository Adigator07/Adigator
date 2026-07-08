export type UrlAlignmentStatus = "aligned" | "misaligned" | "pending" | "skipped";

export interface UrlAlignmentResult {
  status: UrlAlignmentStatus;
  submitted_url: string;
  final_url: string | null;
  summary: string;
  reasons: string[];
  suggestions: string[];
  page_about?: string;
  misalignment_reason?: string;
  confidence: number;
  source: "openai" | "heuristic" | "unavailable";
  checked_at: string;
}

export type AdType = "display" | "video";

export interface UrlValidationRequestBody {
  url: string;
  platform: "programmatic" | "google_ads" | "meta_ads";
  objective?: string;
  vertical?: string;
  campaignName?: string;
  adType?: AdType;
  creatives?: Array<{
    id: string;
    name: string;
    size?: string;
    mediaType?: string;
    imageBase64?: string;
  }>;
}
