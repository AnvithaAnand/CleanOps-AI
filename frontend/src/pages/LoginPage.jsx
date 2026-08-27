import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Database, Eye, EyeOff, Loader2, ShieldCheck, Zap, BarChart3, Sparkles } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const FEATURES = [
  { icon: BarChart3,   text: "Automated column profiling and trust scoring", color: "#818cf8" },
  { icon: ShieldCheck, text: "AI-powered issue detection and smart repairs", color: "#34d399" },
  { icon: Zap,         text: "Scheduled scans, drift alerts, and data contracts", color: "#fbbf24" },
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
    <div className="min-h-screen flex relative overflow-hidden" style={{ background: "var(--bg)" }}>

      {/* Background orbs */}
      <div className="orb animate-float" style={{ width: 500, height: 500, top: "-10%", left: "-5%", background: "radial-gradient(circle, rgba(129,140,248,0.12), transparent 70%)" }} />
      <div className="orb" style={{ width: 400, height: 400, bottom: "-10%", right: "10%", background: "radial-gradient(circle, rgba(168,85,247,0.08), transparent 70%)" }} />
      <div className="orb" style={{ width: 300, height: 300, top: "40%", right: "-5%", background: "radial-gradient(circle, rgba(99,102,241,0.06), transparent 70%)" }} />

      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[520px] flex-shrink-0 p-12 relative"
        style={{ background: "var(--bg-sidebar)", borderRight: "1px solid var(--border)" }}>

        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(160deg, rgba(129,140,248,0.04) 0%, transparent 50%, rgba(168,85,247,0.03) 100%)" }} />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #818cf8, #6366f1, #7c3aed)", boxShadow: "0 4px 20px rgba(129,140,248,0.4)" }}>
              <Database style={{ width: 18, height: 18, color: "#fff" }} />
            </div>
            <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>CleanOps AI</span>
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles style={{ width: 12, height: 12, color: "var(--accent)" }} />
            <p className="section-label">Autonomous Data Reliability</p>
          </div>
          <h2 className="text-[2.5rem] font-extrabold leading-[1.1] mb-5" style={{ color: "var(--text-primary)" }}>
            Your data,<br />
            <span className="gradient-text">always trustworthy.</span>
          </h2>
          <p className="text-sm leading-relaxed mb-10" style={{ color: "var(--text-muted)", maxWidth: "360px" }}>
            CleanOps AI automatically profiles, repairs, and monitors your datasets — so your team ships on clean data every time.
          </p>
          <div className="space-y-5">
            {FEATURES.map(({ icon: Icon, text, color }) => (
              <div key={text} className="flex items-start gap-4 group">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 group-hover:scale-110"
                  style={{ background: `${color}15`, border: `1px solid ${color}30`, boxShadow: `0 0 20px ${color}10` }}>
                  <Icon style={{ width: 15, height: 15, color }} />
                </div>
                <p className="text-[13px] leading-relaxed pt-1.5" style={{ color: "var(--text-secondary)" }}>{text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs relative z-10" style={{ color: "var(--text-faint)" }}>
          &copy; {new Date().getFullYear()} CleanOps AI &middot; Built with intelligence
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="w-full max-w-[380px] animate-fade-in">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #818cf8, #6366f1, #7c3aed)", boxShadow: "0 4px 20px rgba(129,140,248,0.4)" }}>
              <Database style={{ width: 18, height: 18, color: "#fff" }} />
            </div>
            <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>CleanOps AI</span>
          </div>

          <h1 className="text-2xl font-bold mb-1.5" style={{ color: "var(--text-primary)" }}>Welcome back</h1>
          <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>Sign in to your workspace</p>

          {error && (
            <div className="rounded-xl px-4 py-3 mb-5 text-xs font-medium animate-scale-in"
              style={{ background: "var(--danger-bg)", border: "1px solid var(--danger-border)", color: "var(--danger)" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="co-input"
                style={{ padding: "0.625rem 0.875rem" }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="co-input pr-10"
                  style={{ padding: "0.625rem 0.875rem" }}
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
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-3 text-sm">
              {loading && <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />}
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="text-xs text-center mt-8" style={{ color: "var(--text-muted)" }}>
            No account?{" "}
            <Link to="/signup" className="font-semibold transition-colors hover:opacity-80" style={{ color: "var(--accent)", textDecoration: "none" }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
