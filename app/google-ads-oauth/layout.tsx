import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Connect Google Ads | Adigator IQ",
  description: "Connect the Google Ads account you own or manage to Adigator IQ using Google’s official sign-in.",
};

export default function GoogleAdsOAuthLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="marketing-page min-h-screen bg-[#F5F5F0]" />}>{children}</Suspense>;
}
