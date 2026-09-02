import { createBrowserRouter, useRouteError } from "react-router-dom";
import { Database, RefreshCw } from "lucide-react";
import Layout from "./components/layout/Layout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import UploadPage from "./pages/UploadPage";
import DatasetExplorer from "./pages/DatasetExplorer";
import IssuesPage from "./pages/IssuesPage";
import RuleBuilder from "./pages/RuleBuilder";
import AuditReport from "./pages/AuditReport";
import AlertsPage from "./pages/AlertsPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import UsersPage from "./pages/UsersPage";
import ActivityPage from "./pages/ActivityPage";
import NotFoundPage from "./pages/NotFoundPage";
import SettingsPage from "./pages/SettingsPage";

function RouteErrorFallback() {
  const error = useRouteError();
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--bg)" }}>
      <div className="text-center max-w-md animate-fade-in">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: "var(--danger-bg)", border: "1px solid var(--danger-border)" }}>
          <Database style={{ width: 28, height: 28, color: "var(--danger)" }} />
        </div>
        <h1 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>Something went wrong</h1>
        <p className="text-sm mb-6 leading-relaxed" style={{ color: "var(--text-muted)" }}>
          An unexpected error occurred. Try refreshing the page.
        </p>
        <button onClick={() => window.location.reload()} className="btn-primary mx-auto">
          <RefreshCw style={{ width: 14, height: 14 }} />
          Reload Page
        </button>
        {error?.message && (
          <pre className="mt-6 text-left text-[10px] p-3 rounded-lg overflow-x-auto"
            style={{ background: "var(--bg-hover)", color: "var(--text-faint)", maxHeight: 120 }}>
            {error.message}
          </pre>
        )}
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  { path: "/login",  element: <LoginPage /> },
  { path: "/signup", element: <SignupPage /> },
  {
    path: "/",
    element: <ProtectedRoute><Layout /></ProtectedRoute>,
    errorElement: <RouteErrorFallback />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "upload", element: <UploadPage /> },
      { path: "dataset/:id", element: <DatasetExplorer /> },
      { path: "dataset/:id/issues", element: <IssuesPage /> },
      { path: "dataset/:id/audit", element: <AuditReport /> },
      { path: "rules", element: <RuleBuilder /> },
      { path: "alerts", element: <AlertsPage /> },
      { path: "activity", element: <ActivityPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "users", element: <ProtectedRoute requiredRole="admin"><UsersPage /></ProtectedRoute> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
