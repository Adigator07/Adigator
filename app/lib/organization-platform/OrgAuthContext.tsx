"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseClientAuth } from "@/app/lib/firebase/client";
import { getClientProfileData } from "@/app/lib/firestore/clientProfiles";
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
    const auth = getFirebaseClientAuth();

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      void (async () => {
        if (!firebaseUser) {
          setState({ isOrgAdmin: false, loading: false, organizationId: null, organizationName: null, memberRole: null });
          return;
        }

        const profile = await getClientProfileData<{ organizationId?: string; organizationName?: string; memberRole?: string; role?: string }>(firebaseUser.uid);

        const roleCandidate = profile?.memberRole || profile?.role || "";
        const memberRole = (isOrgAdminRole(roleCandidate as OrgMemberRole)
          ? roleCandidate
          : null) as OrgMemberRole | null;

        setState({
          isOrgAdmin: Boolean(memberRole),
          loading: false,
          organizationId: profile?.organizationId || null,
          organizationName: profile?.organizationName || null,
          memberRole,
        });
      })();
    });

    return () => unsubscribe();
  }, []);

  return <OrgAuthContext.Provider value={state}>{children}</OrgAuthContext.Provider>;
}

export function useOrgAuth() {
  return useContext(OrgAuthContext);
}
