import { createBrowserRouter } from "react-router-dom";
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

export const router = createBrowserRouter([
  { path: "/login",  element: <LoginPage /> },
  { path: "/signup", element: <SignupPage /> },
  {
    path: "/",
    element: <ProtectedRoute><Layout /></ProtectedRoute>,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "upload", element: <UploadPage /> },
      { path: "dataset/:id", element: <DatasetExplorer /> },
      { path: "dataset/:id/issues", element: <IssuesPage /> },
      { path: "dataset/:id/audit", element: <AuditReport /> },
      { path: "rules", element: <RuleBuilder /> },
      { path: "alerts", element: <AlertsPage /> },
      { path: "activity", element: <ActivityPage /> },
      { path: "users", element: <ProtectedRoute requiredRole="admin"><UsersPage /></ProtectedRoute> },
    ],
  },
]);
