import { createBrowserRouter } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import UploadPage from "./pages/UploadPage";
import DatasetExplorer from "./pages/DatasetExplorer";
import IssuesPage from "./pages/IssuesPage";
import RuleBuilder from "./pages/RuleBuilder";
import AuditReport from "./pages/AuditReport";
import AlertsPage from "./pages/AlertsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "upload", element: <UploadPage /> },
      { path: "dataset/:id", element: <DatasetExplorer /> },
      { path: "dataset/:id/issues", element: <IssuesPage /> },
      { path: "dataset/:id/audit", element: <AuditReport /> },
      { path: "rules", element: <RuleBuilder /> },
      { path: "alerts", element: <AlertsPage /> },
    ],
  },
]);
