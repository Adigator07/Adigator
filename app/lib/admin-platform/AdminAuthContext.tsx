"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { isCurrentUserAdmin } from "@/app/lib/admin/activityAdminClient";

type AdminAuthState = {
  isAdmin: boolean;
  loading: boolean;
};

const AdminAuthContext = createContext<AdminAuthState>({ isAdmin: false, loading: true });

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AdminAuthState>({ isAdmin: false, loading: true });

  useEffect(() => {
    let active = true;
    isCurrentUserAdmin().then((isAdmin) => {
      if (active) setState({ isAdmin, loading: false });
    });
    return () => { active = false; };
  }, []);

  return (
    <AdminAuthContext.Provider value={state}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}
