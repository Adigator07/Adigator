"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import type { PresenceUser } from "@/app/lib/admin-platform/types";

export function RealtimePresence() {
  const [onlineCount, setOnlineCount] = useState(0);
  const [users, setUsers] = useState<PresenceUser[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_REALTIME_URL;
    if (!url) return;

    let socket: { disconnect: () => void } | null = null;
    let active = true;

    import("socket.io-client").then(({ io }) => {
      if (!active) return;
      const s = io(url, {
        transports: ["websocket"],
        reconnectionAttempts: 2,
        timeout: 5000,
      });
      socket = s;
      s.on("connect", () => setConnected(true));
      s.on("disconnect", () => setConnected(false));
      s.on("connect_error", () => setConnected(false));
      s.on("presence:update", (payload: { count: number; users: PresenceUser[] }) => {
        setOnlineCount(payload.count);
        setUsers(payload.users || []);
      });
    }).catch(() => setConnected(false));

    return () => {
      active = false;
      socket?.disconnect();
    };
  }, []);

  const hasRealtime = Boolean(process.env.NEXT_PUBLIC_REALTIME_URL);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span>Live Users</span>
          <span className={`text-[10px] font-bold uppercase ${connected ? "text-emerald-400" : "text-white/40"}`}>
            {connected ? "Live" : hasRealtime ? "Offline" : "Not configured"}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-black text-white tabular-nums">{onlineCount}</p>
        <p className="mt-1 text-xs text-white/40">Users online now</p>
        <div className="mt-4 max-h-48 space-y-2 overflow-y-auto">
          {users.slice(0, 8).map((u) => (
            <div key={u.userId} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
              <p className="text-sm font-semibold text-white">{u.name}</p>
              <p className="text-xs text-white/50">Current page: {u.currentPage}</p>
            </div>
          ))}
          {!hasRealtime ? (
            <p className="text-xs text-white/40">Set NEXT_PUBLIC_REALTIME_URL and start the realtime server for live presence.</p>
          ) : users.length === 0 ? (
            <p className="text-xs text-white/40">No users connected to the realtime server.</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
