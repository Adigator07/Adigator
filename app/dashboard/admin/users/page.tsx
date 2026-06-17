"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Download, Search } from "lucide-react";
import { adminApi } from "@/app/lib/admin-platform/client";
import type { AdminUser } from "@/app/lib/admin-platform/types";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";

function statusVariant(status: string): "success" | "warning" | "danger" | "default" {
  if (status === "active") return "success";
  if (status === "suspended") return "warning";
  if (status === "banned") return "danger";
  return "default";
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.listUsers({ page, limit: 20, search });
      setUsers(res.users);
      setTotalPages(res.totalPages);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const handleExport = async () => {
    const csv = await adminApi.exportUsersCsv();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const runAction = async (userId: string, action: string) => {
    await adminApi.userAction(userId, { action });
    await load();
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">User Management</h1>
          <p className="mt-1 text-sm text-white/40">Search, filter, and manage platform users.</p>
        </div>
        <Button variant="outline" onClick={handleExport} className="gap-2">
          <Download size={16} /> Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
              <Input className="pl-9" placeholder="Search name, email, phone…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          {loading ? (
            <p className="text-sm text-white/40">Loading users…</p>
          ) : (
            <table className="w-full min-w-[960px] text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-white/40">
                  <th className="px-2 py-2">User</th>
                  <th className="px-2 py-2">Role</th>
                  <th className="px-2 py-2">Status</th>
                  <th className="px-2 py-2">Registered</th>
                  <th className="px-2 py-2">Last login</th>
                  <th className="px-2 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-white/5 text-white/80">
                    <td className="px-2 py-3">
                      <Link href={`/dashboard/admin/users/${u.id}`} className="font-semibold text-amber-200 hover:underline">
                        {u.fullName || u.email}
                      </Link>
                      <p className="text-xs text-white/40">{u.email}</p>
                    </td>
                    <td className="px-2 py-3">{u.adminRole || u.role}</td>
                    <td className="px-2 py-3"><Badge variant={statusVariant(u.status)}>{u.status}</Badge></td>
                    <td className="px-2 py-3 whitespace-nowrap">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-2 py-3 whitespace-nowrap">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "—"}</td>
                    <td className="px-2 py-3">
                      <div className="flex flex-wrap gap-1">
                        {u.status !== "suspended" ? (
                          <Button size="sm" variant="ghost" onClick={() => runAction(u.id, "suspend")}>Suspend</Button>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={() => runAction(u.id, "activate")}>Activate</Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => runAction(u.id, "ban")}>Ban</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="mt-4 flex items-center justify-between text-xs text-white/40">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
              <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
