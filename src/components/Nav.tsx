import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/AuthContext";
import { supabase } from "../lib/supabase";

export default function Nav() {
  const { user, enabled } = useAuth();
  const navigate = useNavigate();

  async function signOut() {
    await supabase?.auth.signOut();
    navigate("/");
  }

  return (
    <nav className="nav">
      <div className="nav-inner">
        <Link to="/" className="brand">
          <img className="logo" src="/favicon.svg" alt="" />
          <span>
            Infla<span className="tag">Tax</span>
          </span>
        </Link>
        <div className="nav-actions">
          {/* Only one nav item per spec: Profile. */}
          <Link className="btn secondary" to="/profile">
            Profile
          </Link>
          {enabled && user && (
            <button className="btn secondary" onClick={signOut}>
              Sign out
            </button>
          )}
          {enabled && !user && (
            <Link className="btn" to="/login">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
