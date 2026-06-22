import { useEffect, useState } from "react";
import {
  createUser,
  getUsersForManager,
  removeAccount,
  setPassword,
  usernameTaken,
  type Account,
} from "../lib/storage";
import { useT } from "../lib/i18n";

// Create / reset-password / remove employees under one manager (an admin).
// Used by the admin dashboard and the superadmin's per-admin sub-panel.
export default function UserManager({
  manager,
  onChange,
}: {
  manager: Account;
  onChange?: () => void;
}) {
  const { t } = useT();
  const [users, setUsers] = useState<Account[]>([]);
  const [name, setName] = useState("");
  const [full, setFull] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState<string | null>(null);

  function refresh() {
    setUsers(getUsersForManager(manager.id));
  }
  useEffect(refresh, [manager.id]);

  function notify() {
    refresh();
    onChange?.();
  }

  function add(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!name.trim() || pass.length < 4) {
      setErr(t("admin.err_user"));
      return;
    }
    if (usernameTaken(name)) {
      setErr(t("admin.err_dupe"));
      return;
    }
    createUser(manager, { username: name, password: pass, fullName: full });
    setName("");
    setFull("");
    setPass("");
    notify();
  }

  function resetPw(u: Account) {
    const pw = window.prompt(t("admin.reset_prompt", { name: u.username }));
    if (pw && pw.length >= 4) {
      setPassword(u.id, pw);
      window.alert(t("admin.reset_done"));
    } else if (pw !== null) {
      window.alert(t("admin.err_user"));
    }
  }

  function remove(u: Account) {
    if (window.confirm(t("admin.remove_confirm", { name: u.username }))) {
      removeAccount(u.id);
      notify();
    }
  }

  return (
    <>
      <form onSubmit={add} className="row">
        <label className="field grow">
          <span className="label">{t("admin.username")}</span>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="field grow">
          <span className="label">{t("admin.fullname")}</span>
          <input type="text" value={full} onChange={(e) => setFull(e.target.value)} />
        </label>
        <label className="field grow">
          <span className="label">{t("auth.password")}</span>
          <input
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />
        </label>
        <div className="field">
          <button className="btn" type="submit">
            {t("admin.add_user")}
          </button>
        </div>
      </form>
      {err && <div className="alert error">{err}</div>}

      {users.length === 0 ? (
        <p className="muted small">{t("admin.no_team")}</p>
      ) : (
        <ul className="branch-list">
          {users.map((u) => (
            <li key={u.id}>
              <span>
                <strong>{u.username}</strong>
                {u.fullName ? ` · ${u.fullName}` : ""}
              </span>
              <span style={{ display: "flex", gap: 8 }}>
                <button className="btn secondary" onClick={() => resetPw(u)}>
                  {t("admin.reset_pw")}
                </button>
                <button className="row-del" onClick={() => remove(u)}>
                  ✕
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
