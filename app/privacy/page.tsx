import LegalDocumentPage, { type LegalSection } from "@/app/components/marketing/LegalDocumentPage";

const PRIVACY_SECTIONS: LegalSection[] = [
  {
    title: "What Adigator Does",
    paragraphs: [
      "Adigator is a pre-launch campaign validation SaaS platform. We help agencies, brands, and AdOps teams review creatives, campaign setup, landing pages, and platform readiness before media spend begins across Google Ads, Meta Ads, and programmatic channels.",
      "When you choose to connect Google Ads, Adigator uses Google OAuth so you can authorize access to Google Ads accounts that you already own or administer. We do not create Google Ads accounts for you, and we do not access accounts you have not authorized.",
    ],
  },
  {
    title: "Information We Collect",
    paragraphs: ["When you use Adigator, we may collect:"],
    bullets: [
      "Name and contact information",
      "Company name",
      "Email address",
      "Account information",
      "Campaign assets you upload (such as creatives, campaign briefs, landing pages, and validation data)",
      "Platform usage information",
      "Device and browser information",
      "Cookies and analytics data",
      "Google account identity details (such as email and profile) when you connect Google Ads via OAuth",
      "Google Ads account identifiers and campaign metadata you authorize Adigator to access",
    ],
    closing: "We only collect information necessary to provide and improve our services.",
  },
  {
    title: "Google Ads OAuth and Account Authorization",
    paragraphs: [
      "Adigator users authorize access to their own Google Ads accounts (or accounts they are permitted to administer) through Google’s official OAuth consent screen.",
      "Connecting Google Ads is optional. You initiate the connection from Adigator, sign in with Google, review the requested permissions, and grant or deny access. Adigator only receives access after you explicitly approve the OAuth consent request.",
      "We use this authorized access to support product features such as listing accessible Google Ads accounts, importing campaign context for validation, and helping you manage workflow inside Adigator. We do not use your Google Ads connection to run media spend on your behalf without your direction inside the product.",
      "You may disconnect Google Ads from Adigator at any time. You can also revoke Adigator’s access from your Google Account permissions settings.",
    ],
    bullets: [
      "Users authorize Adigator to access only Google Ads accounts they own or are authorized to manage",
      "OAuth tokens are used to provide Adigator features you request",
      "We do not sell Google Ads data",
      "We do not use customer Google Ads data to train public AI models or share it with other customers",
    ],
  },
  {
    title: "How We Use Your Information",
    paragraphs: ["We use your information to:"],
    bullets: [
      "Provide campaign validation services",
      "Analyze uploaded campaign assets",
      "Connect to Google Ads when you authorize OAuth access",
      "Improve platform performance",
      "Respond to support requests",
      "Maintain account security",
      "Develop new platform features",
      "Communicate important product updates",
    ],
    closing: "We do not sell your personal information.",
  },
  {
    title: "Campaign Data",
    paragraphs: [
      "Campaign materials uploaded to Adigator remain your property.",
      "We process campaign data only to perform validation, generate reports, and improve your experience within the platform.",
      "We do not use your confidential campaign information for advertising purposes.",
    ],
  },
  {
    title: "Data Security",
    paragraphs: [
      "We use industry-standard security practices designed to protect customer information, including credentials and OAuth tokens associated with connected advertising platforms.",
      "While no online service can guarantee absolute security, we continuously work to safeguard your data.",
    ],
  },
  {
    title: "Cookies",
    paragraphs: [
      "Adigator uses cookies and similar technologies to improve functionality, analyze usage, maintain sessions (including OAuth connection state), and enhance your experience.",
      "You can manage cookie preferences through your browser settings.",
    ],
  },
  {
    title: "Third-Party Services",
    paragraphs: ["We may use trusted third-party providers for services such as:"],
    bullets: [
      "Authentication",
      "Google OAuth and Google Ads APIs",
      "Cloud storage",
      "Analytics",
      "Payment processing",
      "AI services",
      "Infrastructure hosting",
    ],
    closing: "These providers process information only as necessary to deliver our services.",
  },
  {
    title: "Data Retention",
    paragraphs: [
      "We retain information only as long as necessary to provide our services, comply with legal obligations, or resolve disputes.",
      "You may request deletion of your account and associated data, subject to applicable legal requirements. Disconnecting Google Ads stops further authorized API access from Adigator.",
    ],
  },
  {
    title: "Your Rights",
    paragraphs: ["Depending on your location, you may have the right to:"],
    bullets: [
      "Access your information",
      "Update inaccurate information",
      "Request deletion",
      "Export your data",
      "Withdraw consent where applicable",
      "Disconnect Google Ads and revoke OAuth permissions",
    ],
  },
  {
    title: "Changes to This Policy",
    paragraphs: [
      "We may update this Privacy Policy from time to time.",
      'Material changes will be reflected by updating the "Last Updated" date.',
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalDocumentPage
      title="Privacy Policy"
      lastUpdated="August 2026"
      intro={[
        "At Adigator, we respect your privacy and are committed to protecting your information.",
        "This Privacy Policy explains what information we collect, how we use it, and the choices you have when using our platform — including optional Google Ads connections via OAuth.",
      ]}
      sections={PRIVACY_SECTIONS}
      contactLabel="For privacy-related questions, please contact:"
      contactEmail="privacy@adigator.in"
    />
  );
}
