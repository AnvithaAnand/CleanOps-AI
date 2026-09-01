import { Link } from "react-router-dom";
import { Home, SearchX } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: "var(--accent-bg)", border: "1px solid var(--accent-border)", boxShadow: "var(--glow-sm)" }}>
          <SearchX style={{ width: 28, height: 28, color: "var(--accent)" }} />
        </div>
        <h1 className="text-4xl font-extrabold mb-2 gradient-text">404</h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          This page doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn-primary mx-auto" style={{ textDecoration: "none" }}>
          <Home style={{ width: 14, height: 14 }} />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
