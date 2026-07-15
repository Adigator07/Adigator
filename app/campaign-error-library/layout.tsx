import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Campaign Error Library | Adigator",
  description:
    "Searchable library of preventable campaign errors with business impact, detection logic, and recommended actions.",
};

export default function CampaignErrorLibraryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
