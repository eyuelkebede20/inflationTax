import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import Nav from "./components/Nav";
import Home from "./pages/Home";
import ChatWidget from "./components/ChatWidget";
import { AUTH_ENABLED } from "./config";
import { useT } from "./lib/i18n";

// Code-split everything past the landing route so the first paint stays light.
const Analysis = lazy(() => import("./pages/Analysis"));
const Profile = lazy(() => import("./pages/Profile"));
const Shared = lazy(() => import("./pages/Shared"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const SuperAdminDashboard = lazy(() => import("./pages/SuperAdminDashboard"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const UpdatePassword = lazy(() => import("./pages/UpdatePassword"));

function Fallback() {
  return (
    <div className="empty">
      <span className="spinner" />
    </div>
  );
}

export default function App() {
  const { t } = useT();
  return (
    <div className="app-shell">
      <Nav />
      <Suspense fallback={<Fallback />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/analysis/:id" element={<Analysis />} />
          <Route path="/shared" element={<Shared />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/superadmin" element={<SuperAdminDashboard />} />
          {/* Auth routes — active once config.AUTH_ENABLED is flipped on. */}
          {AUTH_ENABLED && <Route path="/login" element={<Login />} />}
          {AUTH_ENABLED && <Route path="/signup" element={<Signup />} />}
          {AUTH_ENABLED && (
            <Route path="/reset-password" element={<ResetPassword />} />
          )}
          {AUTH_ENABLED && (
            <Route path="/update-password" element={<UpdatePassword />} />
          )}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <ChatWidget />
      <footer className="footer no-print">
        <div>{t("footer.tag")}</div>
        <div className="credit">
          © {new Date().getFullYear()} · Made by{" "}
          <a
            href="https://senaycreatives.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            senaycreatives.com
          </a>
        </div>
      </footer>
    </div>
  );
}
