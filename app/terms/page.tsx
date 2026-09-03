import LegalDocumentPage, { type LegalSection } from "@/app/components/marketing/LegalDocumentPage";
import { SITE_EMAILS } from "@/app/lib/siteConfig";

const TERMS_SECTIONS: LegalSection[] = [
  {
    title: "Our Service",
    paragraphs: [
      "Adigator IQ is a SaaS product that provides campaign validation tools. We help advertising teams review campaign assets, technical requirements, landing destinations, and readiness before campaign execution across Google Ads, Meta Ads, and programmatic channels.",
      "Adigator IQ is not a media-buying agency substitute by default. Final campaign decisions and media spend remain your responsibility.",
    ],
  },
  {
    title: "Google Ads Connection via OAuth",
    paragraphs: [
      "Adigator IQ may offer an optional Google Ads integration. When you connect Google Ads, you do so through Google’s OAuth process.",
      "By connecting Google Ads, you confirm that you are authorizing Adigator IQ to access Google Ads accounts that you own or are authorized to administer. You must not connect accounts you do not have permission to manage.",
      "Google’s own terms and policies also apply to your use of Google Ads. Adigator IQ’s access is limited to the permissions you grant on the Google consent screen and to the features you use inside Adigator IQ.",
      "You may disconnect Google Ads from Adigator IQ at any time, and you may revoke Adigator IQ’s access in your Google Account settings.",
    ],
    bullets: [
      "Users authorize access to their own Google Ads accounts (or accounts they are permitted to manage)",
      "OAuth consent is explicit and user-initiated",
      "You remain responsible for actions taken with accounts you connect",
      "Adigator IQ does not claim ownership of your Google Ads accounts or campaign assets",
    ],
  },
  {
    title: "User Responsibilities",
    paragraphs: ["You agree to:"],
    bullets: [
      "Provide accurate account information",
      "Keep your login credentials secure",
      "Upload only content you are authorized to use",
      "Connect only advertising accounts you own or are authorized to manage",
      "Use the platform in accordance with applicable laws and third-party platform policies (including Google Ads policies)",
      "Respect intellectual property rights",
    ],
  },
  {
    title: "Acceptable Use",
    paragraphs: ["You may not:"],
    bullets: [
      "Attempt to disrupt the platform",
      "Reverse engineer the service",
      "Upload malicious software",
      "Use Adigator IQ for unlawful activities",
      "Attempt unauthorized access to other accounts",
      "Use OAuth connections to access Google Ads accounts without proper authorization",
    ],
  },
  {
    title: "Intellectual Property",
    paragraphs: [
      "The Adigator IQ platform, software, branding, and related materials are owned by Adigator IQ.",
      "Users retain ownership of the campaign materials they upload and of their connected advertising-platform accounts.",
    ],
  },
  {
    title: "AI-Assisted Validation",
    paragraphs: [
      "Adigator IQ provides automated validation and recommendations designed to support campaign operations.",
      "Users remain responsible for reviewing campaign materials and making final execution decisions.",
      "Adigator IQ does not guarantee campaign performance or business outcomes.",
    ],
  },
  {
    title: "Service Availability",
    paragraphs: [
      "We strive to maintain reliable service but cannot guarantee uninterrupted availability.",
      "Maintenance, updates, or unforeseen events may occasionally affect access, including third-party APIs such as Google Ads.",
    ],
  },
  {
    title: "Limitation of Liability",
    paragraphs: [
      "To the maximum extent permitted by law, Adigator IQ shall not be liable for indirect, incidental, or consequential damages arising from the use of the platform.",
    ],
  },
  {
    title: "Changes to the Service",
    paragraphs: ["We may modify, improve, or discontinue features as the platform evolves."],
  },
  {
    title: "Termination",
    paragraphs: [
      "We may suspend or terminate accounts that violate these Terms or misuse the platform.",
      "Users may discontinue use of the platform at any time and may revoke connected Google Ads permissions.",
    ],
  },
  {
    title: "Governing Law",
    paragraphs: [
      "These Terms shall be governed by the applicable laws of the jurisdiction in which Adigator IQ operates.",
    ],
  },
];

export default function TermsOfServicePage() {
  return (
    <LegalDocumentPage
      title="Terms of Service"
      lastUpdated="August 2026"
      intro={[
        "These terms apply when you use Adigator IQ. If you don’t agree with them, don’t use the product.",
      ]}
      sections={TERMS_SECTIONS}
      contactLabel="Questions about these terms? Email"
      contactEmail={SITE_EMAILS.legal}
    />
  );
}
