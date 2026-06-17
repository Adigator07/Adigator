"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAdminAuth } from "@/app/lib/admin-platform/AdminAuthContext";
import AdminShell from "@/app/components/admin/AdminShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAdmin, loading } = useAdminAuth();
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (!loading && !isAdmin) setDenied(true);
  }, [loading, isAdmin]);

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
          <h2 className="text-lg font-bold text-white">Admin access required</h2>
          <p className="mt-2 text-sm text-white/60">
            Your account does not have admin privileges. Run the admin SQL migration in Supabase
            and set your profile role to admin.
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

  return <AdminShell>{children}</AdminShell>;
}
