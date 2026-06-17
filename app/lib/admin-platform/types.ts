/**
 * Enterprise Admin Platform — shared types & RBAC
 */

export type AdminRoleType = "super_admin" | "admin" | "moderator" | "support" | "user";

export type UserStatus = "active" | "suspended" | "banned" | "pending_verification";

export const ADMIN_FEATURES = [
  "Dashboard",
  "Reports",
  "Analytics",
  "Settings",
  "Billing",
  "AdminPanel",
  "PreviewTool",
  "Communications",
] as const;

export type AdminFeature = (typeof ADMIN_FEATURES)[number];

export const ROLE_HIERARCHY: Record<AdminRoleType, number> = {
  super_admin: 100,
  admin: 80,
  moderator: 60,
  support: 40,
  user: 10,
};

export const DEFAULT_ROLE_PERMISSIONS: Record<AdminRoleType, string[]> = {
  super_admin: ["*"],
  admin: ["users:read", "users:write", "reports:read", "audit:read", "permissions:write", "analytics:read", "health:read"],
  moderator: ["users:read", "users:suspend", "audit:read"],
  support: ["users:read", "support:write"],
  user: ["dashboard:read"],
};

export type AdminUser = {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  role: string;
  adminRole: AdminRoleType | null;
  status: UserStatus;
  country: string | null;
  avatarUrl: string | null;
  timezone: string | null;
  isOnline: boolean;
  lastLoginAt: string | null;
  lastSeenAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DashboardMetrics = {
  totalUsers: number;
  activeUsers: { today: number; week: number; month: number };
  onlineUsers: number;
  sessions: { avgDurationSeconds: number; peakHour: number | null };
  dau: number;
  wau: number;
  mau: number;
  retentionRate: number;
  churnRate: number;
  topFeatures: Array<{ feature: string; count: number }>;
  topPages: Array<{ page: string; count: number }>;
  deviceBreakdown: Record<string, number>;
  browserBreakdown: Record<string, number>;
  countryBreakdown: Record<string, number>;
  userGrowth: Array<{ date: string; count: number }>;
};

export type PresenceUser = {
  userId: string;
  name: string;
  currentPage: string;
  feature: string | null;
  device: string | null;
  browser: string | null;
  sessionDurationSeconds: number;
};

export type AuditLogEntry = {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetUserId: string | null;
  targetUserName: string | null;
  description: string;
  ipAddress: string | null;
  device: string | null;
  browser: string | null;
  timestamp: string;
};

export function resolveAdminRole(profile: {
  role?: string | null;
  admin_role?: AdminRoleType | null;
}): AdminRoleType {
  if (profile.admin_role) return profile.admin_role;
  if (profile.role === "admin") return "admin";
  return "user";
}

export function hasPermission(role: AdminRoleType, permission: string): boolean {
  const perms = DEFAULT_ROLE_PERMISSIONS[role] || [];
  if (perms.includes("*")) return true;
  return perms.includes(permission);
}

export function canManageRole(actor: AdminRoleType, target: AdminRoleType): boolean {
  return ROLE_HIERARCHY[actor] > ROLE_HIERARCHY[target];
}

export function isStaffRole(role: AdminRoleType): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.support;
}
