"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import Sidebar from "../components/sidebar";
import Topbar from "../components/topbar";
import { AdminAuthProvider } from "../lib/admin-platform/AdminAuthContext";
import { OrgAuthProvider } from "../lib/organization-platform/OrgAuthContext";

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/dashboard/admin");
  const isOrgRoute = pathname?.startsWith("/dashboard/organization");

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("status")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profile?.status && profile.status !== "active") {
        await supabase.auth.signOut();
        router.push(profile.status === "pending_verification" ? "/login?pending=1" : "/login?disabled=1");
        return;
      }

      setUser(session.user);
    };
    getUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) {
        router.push("/login");
        return;
      }
      void (async () => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("status")
          .eq("id", session.user.id)
          .maybeSingle();

        if (profile?.status && profile.status !== "active") {
          await supabase.auth.signOut();
          router.push(profile.status === "pending_verification" ? "/login?pending=1" : "/login?disabled=1");
          return;
        }

        setUser(session.user);
      })();
    });
    return () => subscription.unsubscribe();
  }, [router]);

  if (isAdminRoute || isOrgRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white flex">
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar user={user} />
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <OrgAuthProvider>
        <DashboardLayoutInner>{children}</DashboardLayoutInner>
      </OrgAuthProvider>
    </AdminAuthProvider>
  );
}
