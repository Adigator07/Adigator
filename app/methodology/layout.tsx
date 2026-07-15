import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Campaign Validation Methodology | Adigator",
  description:
    "Adigator's five-layer campaign validation framework, from campaign intelligence and alignment to technical gates, operational tasks, and campaign memory.",
};

export default function MethodologyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
