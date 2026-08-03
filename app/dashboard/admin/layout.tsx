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
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_36%),linear-gradient(135deg,#f8fbff_0%,#eef8ff_55%,#f6fbff_100%)] text-slate-600">
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-sky-200/80 bg-white/80 px-8 py-7 shadow-[0_20px_60px_-24px_rgba(14,116,144,0.28)] backdrop-blur-xl">
          <Loader2 size={24} className="animate-spin text-sky-600" />
          <p className="text-sm text-slate-600">Checking admin access…</p>
        </div>
      </div>
    );
  }

  if (denied) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_36%),linear-gradient(135deg,#f8fbff_0%,#eef8ff_55%,#f6fbff_100%)] p-6">
        <div className="mx-auto max-w-lg rounded-3xl border border-red-200 bg-white/90 p-8 text-center shadow-[0_20px_60px_-24px_rgba(14,116,144,0.25)]">
          <h2 className="text-lg font-bold text-slate-800">Admin access required</h2>
          <p className="mt-2 text-sm text-slate-600">
            Your account does not have admin privileges. Run the admin SQL migration in Supabase
            and set your profile role to admin.
          </p>
          <button
            type="button"
            onClick={() => router.replace("/dashboard")}
            className="mt-6 rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  return <AdminShell>{children}</AdminShell>;
}
