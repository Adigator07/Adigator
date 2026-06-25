export type OrgStatus = "active" | "suspended" | "trial";
export type OrgMemberRole = "owner" | "org_admin" | "team_lead" | "member";
export type OrgMemberStatus = "active" | "invited" | "suspended";

export const ORG_ADMIN_ROLES: OrgMemberRole[] = ["owner", "org_admin"];

export type Organization = {
  id: string;
  name: string;
  slug: string;
  status: OrgStatus;
  plan: string;
  industry: string | null;
  website: string | null;
  logoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  teamCount?: number;
  memberCount?: number;
  activeMemberCount?: number;
};

export type Team = {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  memberCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type OrganizationMember = {
  id: string;
  organizationId: string;
  userId: string;
  teamId: string | null;
  teamName: string | null;
  memberRole: OrgMemberRole;
  status: OrgMemberStatus;
  email: string;
  fullName: string | null;
  joinedAt: string;
};

export type OrgDashboardMetrics = {
  organization: Organization;
  totalTeams: number;
  totalMembers: number;
  activeMembersWeek: number;
  creativeAnalyses: number;
  downloads: number;
  previewSessions: number;
  recentActivity: Array<{
    id: string;
    userId: string;
    userName: string;
    action: string;
    feature: string | null;
    timestamp: string;
  }>;
  teamBreakdown: Array<{ teamId: string | null; teamName: string; memberCount: number }>;
  usageByFeature: Array<{ feature: string; count: number }>;
};

export type PlatformOrgMetrics = {
  totalOrganizations: number;
  activeOrganizations: number;
  totalTeams: number;
  totalOrgMembers: number;
  organizations: Organization[];
};

export function isOrgAdminRole(role: OrgMemberRole | null | undefined): boolean {
  return !!role && ORG_ADMIN_ROLES.includes(role);
}

export function orgMemberRoleLabel(role: OrgMemberRole): string {
  const labels: Record<OrgMemberRole, string> = {
    owner: "Owner",
    org_admin: "Org Admin",
    team_lead: "Team Lead",
    member: "Member",
  };
  return labels[role];
}

export function slugifyOrgName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "organization";
}
