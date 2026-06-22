import { Navigate, Route, Routes } from "react-router-dom";
import Nav from "./components/Nav";
import Home from "./pages/Home";
import Analysis from "./pages/Analysis";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ResetPassword from "./pages/ResetPassword";
import UpdatePassword from "./pages/UpdatePassword";
import { useAuth } from "./hooks/AuthContext";
import { useT } from "./lib/i18n";

/** Auth routes only make sense when Supabase is configured. */
function AuthOnly({ children }: { children: JSX.Element }) {
  const { enabled } = useAuth();
  return enabled ? children : <Navigate to="/" replace />;
}

export default function App() {
  const { t } = useT();
  return (
    <div className="app-shell">
      <Nav />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/analysis/:id" element={<Analysis />} />
        <Route path="/profile" element={<Profile />} />
        <Route
          path="/login"
          element={
            <AuthOnly>
              <Login />
            </AuthOnly>
          }
        />
        <Route
          path="/signup"
          element={
            <AuthOnly>
              <Signup />
            </AuthOnly>
          }
        />
        <Route
          path="/reset-password"
          element={
            <AuthOnly>
              <ResetPassword />
            </AuthOnly>
          }
        />
        <Route
          path="/update-password"
          element={
            <AuthOnly>
              <UpdatePassword />
            </AuthOnly>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <footer className="footer">{t("footer.tag")}</footer>
    </div>
  );
}
