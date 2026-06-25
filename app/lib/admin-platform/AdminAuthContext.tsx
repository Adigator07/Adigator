"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type AdminAuthState = {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  loading: boolean;
};

const AdminAuthContext = createContext<AdminAuthState>({ isAdmin: false, isSuperAdmin: false, loading: true });

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AdminAuthState>({ isAdmin: false, isSuperAdmin: false, loading: true });

  useEffect(() => {
    let active = true;
    import("@/app/lib/admin/activityAdminClient").then(({ getCurrentUserAdminRole, isCurrentUserAdmin }) => {
      Promise.all([isCurrentUserAdmin(), getCurrentUserAdminRole()]).then(([isAdmin, role]) => {
        if (active) {
          setState({
            isAdmin,
            isSuperAdmin: role === "super_admin",
            loading: false,
          });
        }
      });
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
