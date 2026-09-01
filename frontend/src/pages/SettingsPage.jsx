import { useState } from "react";
import { Settings, User, Lock, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import client from "../api/client";

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.full_name || "");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const { data } = await client.put("/api/auth/me", { full_name: name.trim() });
      if (setUser) setUser(data);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPw.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPw !== confirmPw) {
      toast.error("Passwords don't match");
      return;
    }
    setChangingPw(true);
    try {
      await client.put("/api/auth/me", {
        current_password: currentPw,
        new_password: newPw,
      });
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      toast.success("Password changed successfully");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to change password");
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Settings</h2>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          Manage your profile and security preferences
        </p>
      </div>

      {/* Profile */}
      <div className="rounded-2xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <div className="h-0.5 w-full -mt-6 -mx-6 mb-6 rounded-t-2xl"
          style={{ width: "calc(100% + 3rem)", background: "linear-gradient(90deg, #6366f1, #8b5cf6)" }} />
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "var(--accent-bg)", border: "1px solid var(--accent-border)" }}>
            <User style={{ width: 15, height: 15, color: "var(--accent)" }} />
          </div>
          <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Profile</h3>
        </div>

        <form onSubmit={handleProfileSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: "var(--text-muted)" }}>Email</label>
            <input type="email" value={user?.email || ""} disabled className="co-input opacity-60 cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: "var(--text-muted)" }}>Full Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="Your name" className="co-input" required />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: "var(--text-muted)" }}>Role</label>
            <input type="text" value={user?.role || ""} disabled
              className="co-input opacity-60 cursor-not-allowed capitalize" />
          </div>
          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all"
            style={{ background: "linear-gradient(135deg, var(--accent), #4f46e5)", boxShadow: "0 2px 12px rgba(99,102,241,0.3)" }}>
            {saving ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />
              : <CheckCircle style={{ width: 14, height: 14 }} />}
            Save Profile
          </button>
        </form>
      </div>

      {/* Password */}
      <div className="rounded-2xl p-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <div className="h-0.5 w-full -mt-6 -mx-6 mb-6 rounded-t-2xl"
          style={{ width: "calc(100% + 3rem)", background: "linear-gradient(90deg, #8b5cf6, #06b6d4)" }} />
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "var(--accent-bg)", border: "1px solid var(--accent-border)" }}>
            <Lock style={{ width: 15, height: 15, color: "var(--accent)" }} />
          </div>
          <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Change Password</h3>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: "var(--text-muted)" }}>Current Password</label>
            <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)}
              placeholder="Enter current password" className="co-input" required />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: "var(--text-muted)" }}>New Password</label>
            <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)}
              placeholder="Minimum 8 characters" className="co-input" required />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
              style={{ color: "var(--text-muted)" }}>Confirm New Password</label>
            <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="Re-enter new password" className="co-input" required />
          </div>
          <button type="submit" disabled={changingPw}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #6366f1)", boxShadow: "0 2px 12px rgba(139,92,246,0.3)" }}>
            {changingPw ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />
              : <Lock style={{ width: 14, height: 14 }} />}
            Change Password
          </button>
        </form>
      </div>
    </div>
  );
}
