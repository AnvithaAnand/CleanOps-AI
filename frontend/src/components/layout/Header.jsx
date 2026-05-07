import { useLocation, Link } from "react-router-dom";

const titles = {
  "/": "Dashboard",
  "/upload": "Upload Dataset",
  "/rules": "Quality Rules",
};

export default function Header() {
  const { pathname } = useLocation();

  const parts = pathname.split("/").filter(Boolean);
  let title = titles[pathname];
  if (!title && parts[0] === "dataset") title = "Dataset Explorer";
  if (!title) title = "CleanOps AI";

  return (
    <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-background">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      </div>
      <div className="flex items-center gap-4">
        <Link
          to="/upload"
          className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          Upload Dataset
        </Link>
      </div>
    </header>
  );
}
