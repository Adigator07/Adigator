import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createServiceSupabase,
  getBearerToken,
  authenticateAdminRequest,
} from "@/app/lib/admin-platform/auth";
import {
  isOrgAdminRole,
  type OrgMemberRole,
  type Organization,
} from "./types";

export type OrgAuthContext = {
  userId: string;
  email: string;
  organizationId: string;
  memberRole: OrgMemberRole;
  organization: Organization;
  isPlatformAdmin: boolean;
};

export { createServiceSupabase, getBearerToken };

export async function authenticateOrgAdminRequest(
  supabase: SupabaseClient,
  accessToken: string,
  organizationId?: string | null,
): Promise<{ ok: true; ctx: OrgAuthContext } | { ok: false; status: number; error: string }> {
  const { data: userData, error: authError } = await supabase.auth.getUser(accessToken);
  if (authError || !userData.user) {
    return { ok: false, status: 401, error: "Invalid or expired session" };
  }

  const userId = userData.user.id;

  const adminResult = await authenticateAdminRequest(supabase, accessToken);
  const isPlatformAdmin = adminResult.ok;

  let membershipQuery = supabase
    .from("organization_members")
    .select(`
      id,
      organization_id,
      member_role,
      status,
      organizations (
        id,
        name,
        slug,
        status,
        plan,
        industry,
        website,
        logo_url,
        created_at,
        updated_at
      )
    `)
    .eq("user_id", userId)
    .eq("status", "active")
    .in("member_role", ["owner", "org_admin"]);

  if (organizationId) {
    membershipQuery = membershipQuery.eq("organization_id", organizationId);
  }

  const { data: memberships, error: memberError } = await membershipQuery.limit(1);

  if (memberError) {
    const msg = memberError.message || "";
    if (msg.includes("organization_members") || msg.includes("does not exist")) {
      return { ok: false, status: 503, error: "Organization tables not migrated. Run supabase/migrations/20260616_organizations_teams.sql" };
    }
    return { ok: false, status: 500, error: memberError.message };
  }

  const membership = memberships?.[0];

  if (!membership && isPlatformAdmin && organizationId) {
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id, name, slug, status, plan, industry, website, logo_url, created_at, updated_at")
      .eq("id", organizationId)
      .maybeSingle();

    if (orgError || !org) {
      return { ok: false, status: 404, error: "Organization not found" };
    }

    return {
      ok: true,
      ctx: {
        userId,
        email: userData.user.email || "",
        organizationId: org.id,
        memberRole: "org_admin",
        organization: mapOrganization(org),
        isPlatformAdmin: true,
      },
    };
  }

  if (!membership) {
    return { ok: false, status: 403, error: "Organization admin access required" };
  }

  const orgJoined = membership.organizations;
  const orgRaw = (Array.isArray(orgJoined) ? orgJoined[0] : orgJoined) as Record<string, unknown> | null;
  if (!orgRaw) {
    return { ok: false, status: 404, error: "Organization not found" };
  }

  const memberRole = membership.member_role as OrgMemberRole;
  if (!isOrgAdminRole(memberRole) && !isPlatformAdmin) {
    return { ok: false, status: 403, error: "Organization admin access required" };
  }

  return {
    ok: true,
    ctx: {
      userId,
      email: userData.user.email || "",
      organizationId: membership.organization_id,
      memberRole,
      organization: mapOrganization(orgRaw),
      isPlatformAdmin,
    },
  };
}

export async function getUserOrgMembership(
  supabase: SupabaseClient,
  userId: string,
): Promise<{
  organizationId: string;
  organizationName: string;
  memberRole: OrgMemberRole;
  isOrgAdmin: boolean;
} | null> {
  const { data, error } = await supabase
    .from("organization_members")
    .select(`
      organization_id,
      member_role,
      organizations ( name )
    `)
    .eq("user_id", userId)
    .eq("status", "active")
    .order("joined_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  const org = data.organizations as { name?: string } | null;

  return {
    organizationId: data.organization_id,
    organizationName: org?.name || "Organization",
    memberRole: data.member_role as OrgMemberRole,
    isOrgAdmin: isOrgAdminRole(data.member_role as OrgMemberRole),
  };
}

function mapOrganization(row: Record<string, unknown>): Organization {
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
  };
}
