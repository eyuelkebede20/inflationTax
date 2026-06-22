import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getAccount, getAccounts, SUPERADMIN_ID, type Account } from "../lib/storage";

// ---------------------------------------------------------------------------
// Roles & hierarchy (idea #8).
//   superadmin -> admins (branch managers) -> users (employees)
//
// Auth is OFF (config.AUTH_ENABLED === false), so "who am I" is driven by a dev
// identity switcher persisted in localStorage. Pick the superadmin, any admin,
// or any employee to preview their view. When real auth lands, replace
// `useRole()` with a hook that reads the signed-in user's profile row.
// ---------------------------------------------------------------------------

export type Role = "user" | "admin" | "superadmin";

export interface Branch {
  id: string;
  name: string;
}

export interface Identity {
  id: string; // SUPERADMIN_ID or an account id
  role: Role;
  branchId: string | null;
  username: string;
  name: string;
}

const SUPER: Identity = {
  id: SUPERADMIN_ID,
  role: "superadmin",
  branchId: null,
  username: "superadmin",
  name: "Super Admin",
};

function toIdentity(acc: Account): Identity {
  return {
    id: acc.id,
    role: acc.role,
    branchId: acc.branchId,
    username: acc.username,
    name: acc.fullName || acc.username,
  };
}

function resolve(id: string): Identity {
  if (id === SUPERADMIN_ID) return SUPER;
  const acc = getAccount(id);
  return acc ? toIdentity(acc) : SUPER;
}

interface RoleValue {
  identity: Identity;
  setIdentityId: (id: string) => void;
  accounts: Account[];
  reloadAccounts: () => void;
  // convenience (back-compat)
  role: Role;
  branchId: string | null;
}

const RoleContext = createContext<RoleValue>({
  identity: SUPER,
  setIdentityId: () => {},
  accounts: [],
  reloadAccounts: () => {},
  role: "superadmin",
  branchId: null,
});

const IDENTITY_KEY = "dev_identity";

export function RoleProvider({ children }: { children: ReactNode }) {
  const [identityId, setIdState] = useState<string>(
    () => localStorage.getItem(IDENTITY_KEY) || SUPERADMIN_ID
  );
  const [accounts, setAccounts] = useState<Account[]>(() => getAccounts());

  const setIdentityId = useCallback((id: string) => {
    setIdState(id);
    localStorage.setItem(IDENTITY_KEY, id);
  }, []);

  const reloadAccounts = useCallback(() => setAccounts(getAccounts()), []);

  const identity = useMemo(() => resolve(identityId), [identityId, accounts]);

  const value = useMemo<RoleValue>(
    () => ({
      identity,
      setIdentityId,
      accounts,
      reloadAccounts,
      role: identity.role,
      branchId: identity.branchId,
    }),
    [identity, setIdentityId, accounts, reloadAccounts]
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole(): RoleValue {
  return useContext(RoleContext);
}
