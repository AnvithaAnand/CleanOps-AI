import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Database, Sparkles, Loader2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function SignupPage() {
  const [form, setForm]   = useState({ email: "", password: "", full_name: "" });
  const [error, setError] = useState("");
  const { signup, loading } = useAuth();
  const navigate            = useNavigate();

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password.length < 8) { setError("Password must be at least 8 characters"); return; }
    const result = await signup(form.email, form.password, form.full_name);
    if (result.ok) {
      navigate("/", { replace: true });
    } else {
      setError(result.error);
    }
  };

  const fieldStyle = {
    background: "var(--bg-hover)",
    border: "1px solid var(--border)",
    color: "var(--text-primary)",
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--bg-main)" }}
    >
      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
          >
            <Database style={{ width: 24, height: 24, color: "#fff" }} />
          </div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>CleanOps AI</h1>
          <p className="text-xs mt-1 flex items-center justify-center gap-1" style={{ color: "var(--accent)" }}>
            <Sparkles style={{ width: 10, height: 10 }} /> Data Reliability Platform
          </p>
        </div>

        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <div className="h-1" style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)" }} />
          <div className="p-7">
            <h2 className="text-base font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Create account</h2>
            <p className="text-xs mb-6" style={{ color: "var(--text-muted)" }}>
              The first account created becomes the admin
            </p>

            {error && (
              <div
                className="rounded-lg px-4 py-3 mb-4 text-xs"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444" }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Full name</label>
                <input
                  value={form.full_name}
                  onChange={set("full_name")}
                  required
                  placeholder="Anvitha Anand"
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={fieldStyle}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  required
                  placeholder="you@example.com"
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={fieldStyle}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={set("password")}
                  required
                  minLength={8}
                  placeholder="Min 8 characters"
                  className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                  style={fieldStyle}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                style={{ background: "linear-gradient(135deg, var(--accent), #4f46e5)", boxShadow: "0 4px 18px rgba(99,102,241,0.3)" }}
              >
                {loading ? <Loader2 style={{ width: 15, height: 15 }} className="animate-spin" /> : null}
                {loading ? "Creating account…" : "Create account"}
              </button>
            </form>

            <p className="text-xs text-center mt-5" style={{ color: "var(--text-muted)" }}>
              Already have an account?{" "}
              <Link to="/login" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
