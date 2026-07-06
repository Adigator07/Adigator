import LegalDocumentPage, { type LegalSection } from "@/app/components/marketing/LegalDocumentPage";

const TERMS_SECTIONS: LegalSection[] = [
  {
    title: "Our Service",
    paragraphs: [
      "Adigator provides campaign validation tools that help advertising teams review campaign assets, technical requirements, and operational readiness before campaign execution.",
    ],
  },
  {
    title: "User Responsibilities",
    paragraphs: ["You agree to:"],
    bullets: [
      "Provide accurate account information",
      "Keep your login credentials secure",
      "Upload only content you are authorized to use",
      "Use the platform in accordance with applicable laws",
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
      "Use Adigator for unlawful activities",
      "Attempt unauthorized access to other accounts",
    ],
  },
  {
    title: "Intellectual Property",
    paragraphs: [
      "The Adigator platform, software, branding, and related materials are owned by Adigator.",
      "Users retain ownership of the campaign materials they upload.",
    ],
  },
  {
    title: "AI-Assisted Validation",
    paragraphs: [
      "Adigator provides automated validation and recommendations designed to support campaign operations.",
      "Users remain responsible for reviewing campaign materials and making final execution decisions.",
      "Adigator does not guarantee campaign performance or business outcomes.",
    ],
  },
  {
    title: "Service Availability",
    paragraphs: [
      "We strive to maintain reliable service but cannot guarantee uninterrupted availability.",
      "Maintenance, updates, or unforeseen events may occasionally affect access.",
    ],
  },
  {
    title: "Limitation of Liability",
    paragraphs: [
      "To the maximum extent permitted by law, Adigator shall not be liable for indirect, incidental, or consequential damages arising from the use of the platform.",
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
      "Users may discontinue use of the platform at any time.",
    ],
  },
  {
    title: "Governing Law",
    paragraphs: [
      "These Terms shall be governed by the applicable laws of the jurisdiction in which Adigator operates.",
    ],
  },
];

export default function TermsOfServicePage() {
  return (
    <LegalDocumentPage
      title="Terms of Service"
      lastUpdated="July 2026"
      intro={[
        "Welcome to Adigator.",
        "By accessing or using the Adigator platform, you agree to these Terms of Service.",
      ]}
      sections={TERMS_SECTIONS}
      contactLabel="Questions regarding these Terms may be directed to:"
      contactEmail="legal@adigator.in"
    />
  );
}
