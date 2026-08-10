import { AdigatorOrbitLoader } from "@/app/components/ui/AdigatorOrbitLoader";

export default function PreviewToolLoading() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0B1220]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.18),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.12),transparent_40%)]"
        aria-hidden
      />
      <AdigatorOrbitLoader
        size="lg"
        tone="dark"
        label="Opening Campaign Intelligence Studio"
        hint="Catch Campaign Mistakes Before Media Spend Begins"
      />
    </div>
  );
}
