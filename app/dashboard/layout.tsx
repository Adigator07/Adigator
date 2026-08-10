"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { onIdTokenChanged, signOut } from "firebase/auth";
import { getFirebaseClientAuthOrNull, hasFirebaseClientConfig } from "../lib/firebase/client";
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
    if (!hasFirebaseClientConfig()) {
      setUser(null);
      setAuthReady(true);
      authDebug("firebase_config_missing");
      return;
    }

    const auth = getFirebaseClientAuthOrNull();
    if (!auth) {
      setUser(null);
      setAuthReady(true);
      return;
    }

    // Optimistic paint: if Firebase already has a session (just logged in), show the shell immediately.
    const current = auth.currentUser;
    if (current) {
      setUser({
        id: current.uid,
        email: current.email,
        user_metadata: {
          full_name: current.displayName || "",
          role: "end_client",
        },
      });
      setAuthReady(true);
      authDebug("optimistic_ready", { uid: current.uid });
    }

    const syncUser = async (firebaseUser: { uid: string; email: string | null; displayName: string | null } | null) => {
      authDebug("sync_start", { hasUser: Boolean(firebaseUser), uid: firebaseUser?.uid ?? null });
      if (!firebaseUser) {
        setUser(null);
        setAuthReady(true);
        authDebug("sync_no_user");
        return;
      }

      // Show chrome first; hydrate profile details in the background.
      setUser((prev: any) => prev?.id === firebaseUser.uid
        ? prev
        : {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            user_metadata: {
              full_name: firebaseUser.displayName || "",
              role: "end_client",
            },
          });
      setAuthReady(true);

      const profile = await Promise.race([
        getClientProfileData<{ status?: string; role?: string; fullName?: string }>(firebaseUser.uid),
        new Promise<null>((resolve) => {
          window.setTimeout(() => resolve(null), 400);
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
      const auth = getFirebaseClientAuthOrNull();
      if (!auth?.currentUser) {
        authDebug("redirect_login_timeout");
        router.replace("/login");
      }
    }, 2500);

    return () => window.clearTimeout(timer);
  }, [authReady, isAdminRoute, isOrgRoute, router, user]);

  if (!authReady && !isAdminRoute && !isOrgRoute) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#EEF4F7] text-slate-600">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
          <p className="mt-4 text-sm font-medium">Opening dashboard…</p>
        </div>
      </div>
    );
  }

  if (isAdminRoute || isOrgRoute) {
    return <>{children}</>;
  }

  return (
    <div className="relative flex min-h-screen overflow-hidden text-slate-800">
      <div className="pointer-events-none absolute inset-0 overflow-hidden [contain:paint]" aria-hidden>
        <div className="agi-dashboard-wallpaper" />
        <div className="agi-smoke-fog opacity-40" />
        <div className="agi-dashboard-grain" />
      </div>

      <div className="relative z-10 flex min-h-screen w-full">
        <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} user={user} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar user={user} />
          <main className="flex-1 overflow-y-auto overscroll-contain bg-transparent p-8 [scrollbar-gutter:stable]">{children}</main>
        </div>
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
