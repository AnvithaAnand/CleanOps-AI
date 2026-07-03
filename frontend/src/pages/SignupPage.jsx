import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Database, Loader2 } from "lucide-react";
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
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-sm animate-fade-in">

        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, var(--accent), #8b5cf6)" }}>
            <Database style={{ width: 18, height: 18, color: "#fff" }} />
          </div>
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>CleanOps AI</span>
        </div>

        <h1 className="text-xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>Create your account</h1>
        <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
          The first account registered becomes the workspace admin.
        </p>

        {error && (
          <div className="rounded-lg px-4 py-3 mb-5 text-xs"
            style={{ background: "var(--danger-bg)", border: "1px solid var(--danger-border)", color: "var(--danger)" }}>
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
              className="co-input"
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
              className="co-input"
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
              className="co-input"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5 mt-2">
            {loading && <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />}
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="text-xs text-center mt-6" style={{ color: "var(--text-muted)" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
