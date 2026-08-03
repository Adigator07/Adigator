"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, ShieldAlert } from "lucide-react";

import { getClientUser } from "@/app/lib/supabaseAuthClient";
import { useRouteLoadTelemetry } from "@/app/lib/routeTelemetry";

type RouteAccessShellProps = {
  routeKey: string;
  title: string;
  children: ReactNode;
};

export default function RouteAccessShell({ routeKey, title, children }: RouteAccessShellProps) {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const markRouteReady = useRouteLoadTelemetry(routeKey);

  useEffect(() => {
    let active = true;

    void getClientUser()
      .then((user) => {
        if (!active) return;
        const isAuthenticated = Boolean(user?.id);
        setAuthenticated(isAuthenticated);
        markRouteReady("auth_checked", { authenticated: isAuthenticated });
      })
      .catch(() => {
        if (!active) return;
        setAuthenticated(false);
        markRouteReady("auth_checked", { authenticated: false });
      })
      .finally(() => {
        if (!active) return;
        setCheckingAuth(false);
      });

    return () => {
      active = false;
    };
  }, [markRouteReady]);

  if (checkingAuth) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center rounded-3xl border border-white/10 bg-white/5 px-6 py-12 text-center">
        <div className="flex flex-col items-center gap-4 text-white/65">
          <Loader2 size={24} className="animate-spin" />
          <div>
            <p className="text-sm font-semibold text-white">Loading {title}</p>
            <p className="mt-1 text-xs text-white/45">Checking your session and preparing the page.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center rounded-3xl border border-rose-300/20 bg-rose-500/5 px-6 py-12 text-center">
        <div className="max-w-md">
          <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-rose-300/25 bg-rose-500/10 text-rose-200">
            <ShieldAlert size={20} />
          </div>
          <p className="text-lg font-bold text-white">Sign in required</p>
          <p className="mt-2 text-sm leading-6 text-white/60">
            {title} needs an authenticated session. Sign in again and reopen this area.
          </p>
          <Link
            href="/login"
            className="mt-5 inline-flex items-center justify-center rounded-xl bg-sky-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-400"
          >
            Open Sign In
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}