import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

// ---------------------------------------------------------------------------
// Roles & branches (idea #8).
//
// Auth is OFF for now (config.AUTH_ENABLED === false), so the "current role"
// and "current branch" are driven by a dev switcher persisted in localStorage.
// This lets us walk through every dashboard while we design them. When real
// auth lands, replace `useRole()` with a hook that reads the signed-in user's
// row from the `profiles` table — the rest of the app keeps working unchanged.
// ---------------------------------------------------------------------------

export type Role = "user" | "admin" | "superadmin";

export const ROLES: { value: Role; label: string }[] = [
  { value: "user", label: "User" },
  { value: "admin", label: "Admin" },
  { value: "superadmin", label: "Superadmin" },
];

export interface Branch {
  id: string;
  name: string;
}

interface RoleValue {
  role: Role;
  setRole: (r: Role) => void;
  branchId: string | null;
  setBranchId: (id: string | null) => void;
}

const RoleContext = createContext<RoleValue>({
  role: "user",
  setRole: () => {},
  branchId: null,
  setBranchId: () => {},
});

const ROLE_KEY = "dev_role";
const BRANCH_KEY = "dev_branch";

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>(
    () => (localStorage.getItem(ROLE_KEY) as Role) || "user"
  );
  const [branchId, setBranchIdState] = useState<string | null>(
    () => localStorage.getItem(BRANCH_KEY) || null
  );

  const setRole = useCallback((r: Role) => {
    setRoleState(r);
    localStorage.setItem(ROLE_KEY, r);
  }, []);

  const setBranchId = useCallback((id: string | null) => {
    setBranchIdState(id);
    if (id) localStorage.setItem(BRANCH_KEY, id);
    else localStorage.removeItem(BRANCH_KEY);
  }, []);

  const value = useMemo(
    () => ({ role, setRole, branchId, setBranchId }),
    [role, setRole, branchId, setBranchId]
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole(): RoleValue {
  return useContext(RoleContext);
}
