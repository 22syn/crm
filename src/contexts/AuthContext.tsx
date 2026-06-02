import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Module = "leads" | "ad_agency" | "system";
export type ModuleRole = "admin" | "user";

type UserRole = "admin" | "sales" | null;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  /** @deprecated Use canAccessModule / isModuleAdmin instead. Kept for backward compat. */
  role: UserRole;
  moduleRoles: Partial<Record<Module, ModuleRole>>;
  superAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  canAccessModule: (module: Module) => boolean;
  isModuleAdmin: (module: Module) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function deriveRole(
  superAdmin: boolean,
  moduleRoles: Partial<Record<Module, ModuleRole>>
): UserRole {
  if (superAdmin) return "admin";
  const modules = Object.values(moduleRoles);
  if (modules.length === 0) return null;
  const hasAdmin = modules.some((r) => r === "admin");
  return hasAdmin ? "admin" : "sales";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [moduleRoles, setModuleRoles] = useState<Partial<Record<Module, ModuleRole>>>({});
  const [superAdmin, setSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const role = useMemo(
    () => deriveRole(superAdmin, moduleRoles),
    [superAdmin, moduleRoles]
  );

  const canAccessModule = (module: Module) =>
    superAdmin || module in moduleRoles;

  const isModuleAdmin = (module: Module) =>
    superAdmin || moduleRoles[module] === "admin";

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(async () => {
            try {
              const [profileRes, rolesRes, legacyRolesRes] = await Promise.all([
                supabase
                  .from("profiles")
                  .select("super_admin")
                  .eq("user_id", session.user.id)
                  .single(),
                supabase
                  .from("user_module_roles")
                  .select("module, role")
                  .eq("user_id", session.user.id),
                supabase
                  .from("user_roles")
                  .select("role")
                  .eq("user_id", session.user.id),
              ]);

              const prof = profileRes.data;
              const roles = rolesRes.data ?? [];
              const legacyRoles = legacyRolesRes.data ?? [];
              setSuperAdmin(prof?.super_admin ?? false);

              const map: Partial<Record<Module, ModuleRole>> = {};
              for (const r of roles) {
                if (r.module && r.role && ["leads", "ad_agency", "system"].includes(r.module)) {
                  map[r.module as Module] = r.role as ModuleRole;
                }
              }
              if (Object.keys(map).length === 0 && legacyRoles.length > 0) {
                const isAdmin = legacyRoles.some((lr) => String(lr.role) === "admin");
                map.leads = isAdmin ? "admin" : "user";
              }
              if (Object.keys(map).length === 0) {
                map.leads = "user";
              }
              setModuleRoles(map);
            } catch {
              setSuperAdmin(false);
              setModuleRoles({});
            } finally {
              setLoading(false);
            }
          }, 0);
        } else {
          setModuleRoles({});
          setSuperAdmin(false);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setModuleRoles({});
    setSuperAdmin(false);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        role,
        moduleRoles,
        superAdmin,
        loading,
        signOut,
        canAccessModule,
        isModuleAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
