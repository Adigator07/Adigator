import type { SupabaseClient } from "@supabase/supabase-js";
import {
  slugifyOrgName,
  type Organization,
  type OrganizationMember,
  type OrgDashboardMetrics,
  type PlatformOrgMetrics,
  type Team,
} from "../types";

function mapOrg(row: Record<string, unknown>): Organization {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    status: row.status as Organization["status"],
    plan: String(row.plan || "standard"),
    industry: (row.industry as string) || null,
    website: (row.website as string) || null,
    logoUrl: (row.logo_url as string) || null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    teamCount: Number(row.team_count ?? 0),
    memberCount: Number(row.member_count ?? 0),
    activeMemberCount: Number(row.active_member_count ?? 0),
  };
}

export async function listOrganizations(
  supabase: SupabaseClient,
): Promise<PlatformOrgMetrics> {
  const { data: orgs, error } = await supabase
    .from("organizations")
    .select("id, name, slug, status, plan, industry, website, logo_url, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const orgIds = (orgs || []).map((o) => o.id);
  const teamCounts: Record<string, number> = {};
  const memberCounts: Record<string, number> = {};

  if (orgIds.length > 0) {
    const [{ data: teams }, { data: members }] = await Promise.all([
      supabase.from("teams").select("organization_id").in("organization_id", orgIds),
      supabase.from("organization_members").select("organization_id, status").in("organization_id", orgIds),
    ]);

    for (const t of teams || []) {
      teamCounts[t.organization_id] = (teamCounts[t.organization_id] || 0) + 1;
    }
    for (const m of members || []) {
      memberCounts[m.organization_id] = (memberCounts[m.organization_id] || 0) + 1;
    }
  }

  const organizations = (orgs || []).map((row) =>
    mapOrg({
      ...row,
      team_count: teamCounts[row.id] || 0,
      member_count: memberCounts[row.id] || 0,
      active_member_count: memberCounts[row.id] || 0,
    }),
  );

  return {
    totalOrganizations: organizations.length,
    activeOrganizations: organizations.filter((o) => o.status === "active").length,
    totalTeams: Object.values(teamCounts).reduce((a, b) => a + b, 0),
    totalOrgMembers: Object.values(memberCounts).reduce((a, b) => a + b, 0),
    organizations,
  };
}

export async function createOrganization(
  supabase: SupabaseClient,
  input: { name: string; slug?: string; plan?: string; ownerUserId?: string },
): Promise<Organization> {
  const slug = input.slug?.trim() || slugifyOrgName(input.name);
  const { data: org, error } = await supabase
    .from("organizations")
    .insert({
      name: input.name.trim(),
      slug,
      plan: input.plan || "standard",
    })
    .select("id, name, slug, status, plan, industry, website, logo_url, created_at, updated_at")
    .single();

  if (error) throw new Error(error.message);

  const { data: defaultTeam, error: teamError } = await supabase
    .from("teams")
    .insert({ organization_id: org.id, name: "General", description: "Default team" })
    .select("id")
    .single();

  if (teamError) throw new Error(teamError.message);

  if (input.ownerUserId) {
    const { error: memberError } = await supabase.from("organization_members").insert({
      organization_id: org.id,
      user_id: input.ownerUserId,
      team_id: defaultTeam.id,
      member_role: "owner",
      status: "active",
    });
    if (memberError) throw new Error(memberError.message);
  }

  return mapOrg({ ...org, team_count: 1, member_count: input.ownerUserId ? 1 : 0 });
}

export async function getOrgDashboardMetrics(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<OrgDashboardMetrics> {
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("id, name, slug, status, plan, industry, website, logo_url, created_at, updated_at")
    .eq("id", organizationId)
    .single();

  if (orgError || !org) throw new Error("Organization not found");

  const [{ data: teams }, { data: members }] = await Promise.all([
    supabase.from("teams").select("id, organization_id, name, description, created_at, updated_at").eq("organization_id", organizationId),
    supabase
      .from("organization_members")
      .select(`
        id,
        organization_id,
        user_id,
        team_id,
        member_role,
        status,
        joined_at,
        profiles ( email, full_name ),
        teams ( name )
      `)
      .eq("organization_id", organizationId),
  ]);

  const memberRows = members || [];
  const userIds = memberRows.map((m) => m.user_id);
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  let activeMembersWeek = 0;
  let creativeAnalyses = 0;
  let downloads = 0;
  let previewSessions = 0;
  const usageMap: Record<string, number> = {};
  let recentActivity: OrgDashboardMetrics["recentActivity"] = [];

  if (userIds.length > 0) {
    const { data: activity } = await supabase
      .from("admin_user_activity")
      .select("id, user_id, action, feature, timestamp")
      .in("user_id", userIds)
      .order("timestamp", { ascending: false })
      .limit(200);

    const activeSet = new Set<string>();
    for (const row of activity || []) {
      if (row.timestamp >= weekAgo) activeSet.add(row.user_id);
      const action = String(row.action).toLowerCase();
      const feature = row.feature ? String(row.feature) : "general";
      usageMap[feature] = (usageMap[feature] || 0) + 1;

      if (action.includes("analy") || action.includes("creative")) creativeAnalyses += 1;
      if (action.includes("download")) downloads += 1;
      if (action.includes("preview")) previewSessions += 1;
    }
    activeMembersWeek = activeSet.size;

    const profileMap = new Map(
      memberRows.map((m) => {
        const p = m.profiles as { email?: string; full_name?: string } | null;
        return [m.user_id, p?.full_name || p?.email || "User"];
      }),
    );

    recentActivity = (activity || []).slice(0, 12).map((row) => ({
      id: row.id,
      userId: row.user_id,
      userName: profileMap.get(row.user_id) || "User",
      action: row.action,
      feature: row.feature,
      timestamp: row.timestamp,
    }));
  }

  const teamBreakdown = (teams || []).map((team) => ({
    teamId: team.id,
    teamName: team.name,
    memberCount: memberRows.filter((m) => m.team_id === team.id).length,
  }));

  const unassigned = memberRows.filter((m) => !m.team_id).length;
  if (unassigned > 0) {
    teamBreakdown.push({ teamId: null, teamName: "Unassigned", memberCount: unassigned });
  }

  return {
    organization: mapOrg({ ...org, team_count: teams?.length || 0, member_count: memberRows.length }),
    totalTeams: teams?.length || 0,
    totalMembers: memberRows.length,
    activeMembersWeek,
    creativeAnalyses,
    downloads,
    previewSessions,
    recentActivity,
    teamBreakdown,
    usageByFeature: Object.entries(usageMap)
      .map(([feature, count]) => ({ feature, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
  };
}

export async function listTeams(supabase: SupabaseClient, organizationId: string): Promise<Team[]> {
  const { data: teams, error } = await supabase
    .from("teams")
    .select("id, organization_id, name, description, created_at, updated_at")
    .eq("organization_id", organizationId)
    .order("name");

  if (error) throw new Error(error.message);

  const { data: members } = await supabase
    .from("organization_members")
    .select("team_id")
    .eq("organization_id", organizationId);

  const counts: Record<string, number> = {};
  for (const m of members || []) {
    if (m.team_id) counts[m.team_id] = (counts[m.team_id] || 0) + 1;
  }

  return (teams || []).map((t) => ({
    id: t.id,
    organizationId: t.organization_id,
    name: t.name,
    description: t.description,
    memberCount: counts[t.id] || 0,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  }));
}

export async function createTeam(
  supabase: SupabaseClient,
  organizationId: string,
  input: { name: string; description?: string },
): Promise<Team> {
  const { data, error } = await supabase
    .from("teams")
    .insert({
      organization_id: organizationId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
    })
    .select("id, organization_id, name, description, created_at, updated_at")
    .single();

  if (error) throw new Error(error.message);

  return {
    id: data.id,
    organizationId: data.organization_id,
    name: data.name,
    description: data.description,
    memberCount: 0,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function listOrganizationMembers(
  supabase: SupabaseClient,
  organizationId: string,
): Promise<OrganizationMember[]> {
  const { data, error } = await supabase
    .from("organization_members")
    .select(`
      id,
      organization_id,
      user_id,
      team_id,
      member_role,
      status,
      joined_at,
      profiles ( email, full_name ),
      teams ( name )
    `)
    .eq("organization_id", organizationId)
    .order("joined_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data || []).map((row) => {
    const profile = row.profiles as { email?: string; full_name?: string } | null;
    const team = row.teams as { name?: string } | null;
    return {
      id: row.id,
      organizationId: row.organization_id,
      userId: row.user_id,
      teamId: row.team_id,
      teamName: team?.name || null,
      memberRole: row.member_role,
      status: row.status,
      email: profile?.email || "",
      fullName: profile?.full_name || null,
      joinedAt: row.joined_at,
    };
  });
}

export async function updateOrganizationMember(
  supabase: SupabaseClient,
  memberId: string,
  organizationId: string,
  updates: { memberRole?: string; teamId?: string | null; status?: string },
): Promise<void> {
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.memberRole) payload.member_role = updates.memberRole;
  if (updates.teamId !== undefined) payload.team_id = updates.teamId;
  if (updates.status) payload.status = updates.status;

  const { error } = await supabase
    .from("organization_members")
    .update(payload)
    .eq("id", memberId)
    .eq("organization_id", organizationId);

  if (error) throw new Error(error.message);
}
