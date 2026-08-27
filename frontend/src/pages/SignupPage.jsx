import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Database, Loader2, Sparkles } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function SignupPage() {
  const [form, setForm]     = useState({ email: "", password: "", full_name: "" });
  const [error, setError]   = useState("");
  const { signup, loading } = useAuth();
  const navigate            = useNavigate();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 8) { setError("Password must be at least 8 characters."); return; }
    const result = await signup(form.email, form.password, form.full_name);
    if (result.ok) navigate("/", { replace: true });
    else setError(result.error);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden" style={{ background: "var(--bg)" }}>

      {/* Background orbs */}
      <div className="orb animate-float" style={{ width: 400, height: 400, top: "-10%", right: "-5%", background: "radial-gradient(circle, rgba(129,140,248,0.1), transparent 70%)" }} />
      <div className="orb" style={{ width: 300, height: 300, bottom: "0%", left: "5%", background: "radial-gradient(circle, rgba(168,85,247,0.07), transparent 70%)" }} />

      <div className="w-full max-w-[400px] animate-fade-in relative z-10">

        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #818cf8, #6366f1, #7c3aed)", boxShadow: "0 4px 20px rgba(129,140,248,0.4)" }}>
            <Database style={{ width: 18, height: 18, color: "#fff" }} />
          </div>
          <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>CleanOps AI</span>
        </div>

        <h1 className="text-2xl font-bold mb-1.5" style={{ color: "var(--text-primary)" }}>Create your account</h1>
        <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
          The first account registered becomes the workspace admin.
        </p>

        {error && (
          <div className="rounded-xl px-4 py-3 mb-5 text-xs font-medium animate-scale-in"
            style={{ background: "var(--danger-bg)", border: "1px solid var(--danger-border)", color: "var(--danger)" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Full name</label>
            <input
              value={form.full_name}
              onChange={set("full_name")}
              required
              placeholder="Anvitha Anand"
              className="co-input"
              style={{ padding: "0.625rem 0.875rem" }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={set("email")}
              required
              placeholder="you@example.com"
              className="co-input"
              style={{ padding: "0.625rem 0.875rem" }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-muted)" }}>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={set("password")}
              required
              minLength={8}
              placeholder="Min 8 characters"
              className="co-input"
              style={{ padding: "0.625rem 0.875rem" }}
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-3 text-sm">
            {loading && <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />}
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <div className="flex items-center justify-center gap-2 mt-6">
          <Sparkles style={{ width: 11, height: 11, color: "var(--accent)" }} />
          <p className="text-xs" style={{ color: "var(--text-faint)" }}>AI-powered data quality in seconds</p>
        </div>

        <p className="text-xs text-center mt-5" style={{ color: "var(--text-muted)" }}>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold transition-colors hover:opacity-80" style={{ color: "var(--accent)", textDecoration: "none" }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
