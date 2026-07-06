import LegalDocumentPage, { type LegalSection } from "@/app/components/marketing/LegalDocumentPage";

const PRIVACY_SECTIONS: LegalSection[] = [
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
    ],
    closing: "We only collect information necessary to provide and improve our services.",
  },
  {
    title: "How We Use Your Information",
    paragraphs: ["We use your information to:"],
    bullets: [
      "Provide campaign validation services",
      "Analyze uploaded campaign assets",
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
      "We use industry-standard security practices designed to protect customer information.",
      "While no online service can guarantee absolute security, we continuously work to safeguard your data.",
    ],
  },
  {
    title: "Cookies",
    paragraphs: [
      "Adigator uses cookies and similar technologies to improve functionality, analyze usage, and enhance your experience.",
      "You can manage cookie preferences through your browser settings.",
    ],
  },
  {
    title: "Third-Party Services",
    paragraphs: ["We may use trusted third-party providers for services such as:"],
    bullets: [
      "Authentication",
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
      "You may request deletion of your account and associated data, subject to applicable legal requirements.",
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
      lastUpdated="July 2026"
      intro={[
        "At Adigator, we respect your privacy and are committed to protecting your information.",
        "This Privacy Policy explains what information we collect, how we use it, and the choices you have when using our platform.",
      ]}
      sections={PRIVACY_SECTIONS}
      contactLabel="For privacy-related questions, please contact:"
      contactEmail="privacy@adigator.in"
    />
  );
}
