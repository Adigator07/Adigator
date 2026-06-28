import MarketingFooter from "@/app/components/MarketingFooter";
import MarketingNav from "@/app/components/MarketingNav";

export default function ContactPage() {
  return (
    <div className="marketing-page min-h-screen bg-[#F5F5F0] text-[#0D0D0D]">
      <MarketingNav activePath="/contact" />
      <main className="pt-28" />
      <MarketingFooter />
    </div>
  );
}
