"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { orgApi } from "@/app/lib/organization-platform/client";
import type { Team } from "@/app/lib/organization-platform/types";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";

export default function OrganizationTeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await orgApi.listTeams();
      setTeams(res.teams);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load teams");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await orgApi.createTeam({ name: name.trim(), description: description.trim() || undefined });
      setName("");
      setDescription("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create team");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Teams</h1>
        <p className="mt-1 text-sm text-white/40">Create and manage teams within your organization.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-white">Create Team</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Team name" />
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description (optional)"
              />
            </div>
            <Button type="submit" disabled={saving || !name.trim()}>
              <Plus size={16} className="mr-1" />
              Add Team
            </Button>
          </form>
        </CardContent>
      </Card>

      {error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
          ))
        ) : teams.length === 0 ? (
          <p className="text-sm text-white/40">No teams yet. Create your first team above.</p>
        ) : (
          teams.map((team) => (
            <Card key={team.id}>
              <CardContent className="pt-6">
                <p className="text-lg font-bold text-white">{team.name}</p>
                {team.description ? (
                  <p className="mt-2 text-sm text-white/50">{team.description}</p>
                ) : null}
                <p className="mt-4 text-xs text-white/40">{team.memberCount || 0} members</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
