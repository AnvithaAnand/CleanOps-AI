import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Database, Eye, EyeOff, Loader2, ShieldCheck, Zap, BarChart3 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const FEATURES = [
  { icon: BarChart3, text: "Automated column profiling and trust scoring" },
  { icon: ShieldCheck, text: "AI-powered issue detection and smart repairs" },
  { icon: Zap,        text: "Scheduled scans, drift alerts, and data contracts" },
];

export default function LoginPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState("");
  const { login, loading }      = useAuth();
  const navigate                = useNavigate();
  const location                = useLocation();
  const from                    = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const result = await login(email, password);
    if (result.ok) navigate(from, { replace: true });
    else setError(result.error);
  };

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>

      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] flex-shrink-0 p-10"
        style={{ background: "var(--bg-sidebar)", borderRight: "1px solid var(--border)" }}>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, var(--accent), #8b5cf6)" }}>
            <Database style={{ width: 18, height: 18, color: "#fff" }} />
          </div>
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>CleanOps AI</span>
        </div>

        <div>
          <p className="section-label mb-3">Data Reliability Platform</p>
          <h2 className="text-3xl font-bold leading-tight mb-4" style={{ color: "var(--text-primary)" }}>
            Your data,<br />always trustworthy.
          </h2>
          <p className="text-sm leading-relaxed mb-8" style={{ color: "var(--text-muted)" }}>
            CleanOps AI automatically profiles, repairs, and monitors your datasets — so your team ships on clean data every time.
          </p>
          <div className="space-y-4">
            {FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: "var(--accent-bg)", border: "1px solid var(--accent-border)" }}>
                  <Icon style={{ width: 13, height: 13, color: "var(--accent-light)" }} />
                </div>
                <p className="text-xs leading-relaxed pt-1" style={{ color: "var(--text-secondary)" }}>{text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs" style={{ color: "var(--text-faint)" }}>
          &copy; {new Date().getFullYear()} CleanOps AI
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm animate-fade-in">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, var(--accent), #8b5cf6)" }}>
              <Database style={{ width: 18, height: 18, color: "#fff" }} />
            </div>
            <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>CleanOps AI</span>
          </div>

          <h1 className="text-xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>Welcome back</h1>
          <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>Sign in to your workspace</p>

          {error && (
            <div className="rounded-lg px-4 py-3 mb-5 text-xs"
              style={{ background: "var(--danger-bg)", border: "1px solid var(--danger-border)", color: "var(--danger)" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="co-input"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="co-input pr-10"
                />
                <button type="button" onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 icon-btn"
                  style={{ width: "auto", height: "auto", padding: 0 }}>
                  {showPw
                    ? <EyeOff style={{ width: 14, height: 14 }} />
                    : <Eye    style={{ width: 14, height: 14 }} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5 mt-2">
              {loading && <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />}
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="text-xs text-center mt-6" style={{ color: "var(--text-muted)" }}>
            No account?{" "}
            <Link to="/signup" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
