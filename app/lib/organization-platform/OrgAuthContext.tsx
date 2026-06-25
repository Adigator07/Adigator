"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/app/lib/supabase";
import { isOrgAdminRole, type OrgMemberRole } from "./types";

type OrgAuthState = {
  isOrgAdmin: boolean;
  loading: boolean;
  organizationId: string | null;
  organizationName: string | null;
  memberRole: OrgMemberRole | null;
};

const OrgAuthContext = createContext<OrgAuthState>({
  isOrgAdmin: false,
  loading: true,
  organizationId: null,
  organizationName: null,
  memberRole: null,
});

export function OrgAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OrgAuthState>({
    isOrgAdmin: false,
    loading: true,
    organizationId: null,
    organizationName: null,
    memberRole: null,
  });

  useEffect(() => {
    let active = true;

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (active) {
          setState({ isOrgAdmin: false, loading: false, organizationId: null, organizationName: null, memberRole: null });
        }
        return;
      }

      const { data, error } = await supabase
        .from("organization_members")
        .select(`
          member_role,
          organization_id,
          organizations ( name )
        `)
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("joined_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!active) return;

      if (error || !data) {
        setState({ isOrgAdmin: false, loading: false, organizationId: null, organizationName: null, memberRole: null });
        return;
      }

      const org = data.organizations as { name?: string } | null;
      const memberRole = data.member_role as OrgMemberRole;

      setState({
        isOrgAdmin: isOrgAdminRole(memberRole),
        loading: false,
        organizationId: data.organization_id,
        organizationName: org?.name || null,
        memberRole,
      });
    }

    load();
    return () => { active = false; };
  }, []);

  return <OrgAuthContext.Provider value={state}>{children}</OrgAuthContext.Provider>;
}

export function useOrgAuth() {
  return useContext(OrgAuthContext);
}
