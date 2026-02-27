"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";

interface User {
  name: string;
  role: string;
}

const UserContext = createContext<User>({ name: "Usuario", role: "Admin" });

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>({ name: "Usuario", role: "Admin" });
  const disableDb = String(process.env.NEXT_PUBLIC_DISABLE_DB || '').toLowerCase() === 'true';

  useEffect(() => {
    const loadUser = async () => {
      if (!supabase || disableDb) return;
      const { data, error } = await supabase.auth.getUser();
      const u = data?.user;
      if (u) {
        const name = (u.user_metadata as any)?.full_name || u.email || 'Usuario';
        const isAdminLocal = localStorage.getItem('adminAuth') === 'true';
        const metaRole = ((u.app_metadata as any)?.role || (u.user_metadata as any)?.role || '') as string;
        let role = 'Admin';
        if (isAdminLocal) role = 'Admin';
        else if (metaRole) role = metaRole.toLowerCase() === 'admin' ? 'Admin' : 'Usuario';
        setUser({ name, role });
      }
    };
    loadUser();
  }, []);

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useUser() {
  return useContext(UserContext);
}
