"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useOrgAuth } from "@/app/lib/organization-platform/OrgAuthContext";
import OrgShell from "@/app/components/organization/OrgShell";

export default function OrganizationLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isOrgAdmin, loading } = useOrgAuth();
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (!loading && !isOrgAdmin) setDenied(true);
  }, [loading, isOrgAdmin]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050816] text-white/40">
        <Loader2 size={24} className="animate-spin" />
      </div>
    );
  }

  if (denied) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050816] p-6">
        <div className="mx-auto max-w-lg rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center">
          <h2 className="text-lg font-bold text-white">Organization admin access required</h2>
          <p className="mt-2 text-sm text-white/60">
            Your account is not assigned as an organization owner or administrator.
            Contact your platform super admin to be added to an organization.
          </p>
          <button
            type="button"
            onClick={() => router.replace("/dashboard")}
            className="mt-6 rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  return <OrgShell>{children}</OrgShell>;
}
