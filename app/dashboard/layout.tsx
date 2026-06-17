"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import Sidebar from "../components/sidebar";
import Topbar from "../components/topbar";
import { AdminAuthProvider } from "../lib/admin-platform/AdminAuthContext";

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/dashboard/admin");

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      setUser(session.user);
    };
    getUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) router.push("/login");
      else setUser(session.user);
    });
    return () => subscription.unsubscribe();
  }, [router]);

  if (isAdminRoute) {
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
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </AdminAuthProvider>
  );
}
