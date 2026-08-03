"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { onIdTokenChanged, signOut } from "firebase/auth";
import { getFirebaseClientAuth } from "../lib/firebase/client";
import { getClientProfileData } from "../lib/firestore/clientProfiles";
import Sidebar from "../components/sidebar";
import Topbar from "../components/topbar";
import { AdminAuthProvider } from "../lib/admin-platform/AdminAuthContext";
import { OrgAuthProvider } from "../lib/organization-platform/OrgAuthContext";

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [authReady, setAuthReady] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/dashboard/admin");
  const isOrgRoute = pathname?.startsWith("/dashboard/organization");

  const authDebug = (event: string, data?: Record<string, unknown>) => {
    try {
      console.info("[AUTH_DASHBOARD]", event, {
        ts: new Date().toISOString(),
        path: window.location.pathname,
        ...data,
      });
    } catch {
      // Ignore logging failures.
    }
  };

  useEffect(() => {
    const auth = getFirebaseClientAuth();

    const syncUser = async (firebaseUser: { uid: string; email: string | null; displayName: string | null } | null) => {
      authDebug("sync_start", { hasUser: Boolean(firebaseUser), uid: firebaseUser?.uid ?? null });
      if (!firebaseUser) {
        setUser(null);
        setAuthReady(true);
        authDebug("sync_no_user");
        return;
      }

      const profile = await Promise.race([
        getClientProfileData<{ status?: string; role?: string; fullName?: string }>(firebaseUser.uid),
        new Promise<null>((resolve) => {
          window.setTimeout(() => resolve(null), 1200);
        }),
      ]);
      const status = profile?.status || "active";
      authDebug("profile_resolved", { hasProfile: Boolean(profile), status, role: profile?.role ?? null });

      if (status !== "active") {
        authDebug("status_blocked", { status });
        await signOut(auth);
        router.push(status === "pending_verification" ? "/login?pending=1" : "/login?disabled=1");
        return;
      }

      setUser({
        id: firebaseUser.uid,
        email: firebaseUser.email,
        user_metadata: {
          full_name: profile?.fullName || firebaseUser.displayName || "",
          role: profile?.role || "end_client",
        },
      });
      setAuthReady(true);
      authDebug("sync_ready", { role: profile?.role || "end_client" });
    };

    const unsubscribe = onIdTokenChanged(auth, (firebaseUser) => {
      authDebug("onIdTokenChanged", { hasUser: Boolean(firebaseUser), uid: firebaseUser?.uid ?? null });
      void syncUser(firebaseUser ? {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
      } : null);
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!authReady || isAdminRoute || isOrgRoute) return;
    if (user) return;

    const timer = window.setTimeout(() => {
      const auth = getFirebaseClientAuth();
      if (!auth.currentUser) {
        authDebug("redirect_login_timeout");
        router.replace("/login");
      }
    }, 8000);

    return () => window.clearTimeout(timer);
  }, [authReady, isAdminRoute, isOrgRoute, router, user]);

  if (!authReady && !isAdminRoute && !isOrgRoute) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_36%),linear-gradient(135deg,#f7fbff_0%,#eef7ff_55%,#f5faff_100%)] text-slate-700 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-sky-200/80 bg-white/80 px-8 py-7 shadow-[0_20px_60px_-24px_rgba(14,116,144,0.28)] backdrop-blur-xl">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-200 border-t-sky-600" />
          <p className="text-sm text-slate-600">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  if (isAdminRoute || isOrgRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.14),transparent_36%),linear-gradient(135deg,#f8fbff_0%,#eef8ff_55%,#f6fbff_100%)] text-slate-800 flex">
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar user={user} />
        <main className="flex-1 overflow-y-auto bg-transparent p-8">{children}</main>
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
