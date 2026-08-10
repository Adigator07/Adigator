import { LoadingState } from "@/app/components/ui/LoadingState";

export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#EEF4F7]">
      <LoadingState title="Loading dashboard" description="Preparing your workspace…" />
    </div>
  );
}
