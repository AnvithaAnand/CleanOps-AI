import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, UserCheck, UserX, ChevronDown, Loader2 } from "lucide-react";
import client from "../api/client";
import { useAuth } from "../contexts/AuthContext";

const ROLES = ["admin", "analyst", "viewer"];

const roleColors = {
  admin:   { bg: "rgba(99,102,241,0.1)",  color: "var(--accent)",  border: "var(--accent-border)" },
  analyst: { bg: "rgba(16,185,129,0.1)",  color: "var(--success)", border: "rgba(16,185,129,0.3)" },
  viewer:  { bg: "var(--bg-hover)",        color: "var(--text-muted)", border: "var(--border)" },
};

function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: () => client.get("/api/auth/users").then((r) => r.data),
  });
}

function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }) => client.put(`/api/auth/users/${id}/role`, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

function useToggleActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => client.put(`/api/auth/users/${id}/active`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

export default function UsersPage() {
  const { user: me } = useAuth();
  const { data: users = [], isLoading } = useUsers();
  const updateRole  = useUpdateRole();
  const toggleActive = useToggleActive();

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>User Management</h2>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
          Manage roles and access for all CleanOps AI users
        </p>
      </div>

      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        {/* Header row */}
        <div
          className="grid grid-cols-4 px-5 py-3 text-[10px] font-bold uppercase tracking-widest"
          style={{ borderBottom: "1px solid var(--border)", color: "var(--text-faint)" }}
        >
          <span>User</span>
          <span>Email</span>
          <span>Role</span>
          <span>Status</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 style={{ width: 20, height: 20, color: "var(--text-muted)" }} className="animate-spin" />
          </div>
        ) : (
          users.map((u) => {
            const rc = roleColors[u.role] || roleColors.viewer;
            const isMe = u.id === me?.id;
            return (
              <div
                key={u.id}
                className="grid grid-cols-4 items-center px-5 py-3.5"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                {/* Name */}
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: rc.bg, color: rc.color }}
                  >
                    {u.full_name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                      {u.full_name}
                      {isMe && <span className="ml-1.5 text-[9px] font-bold px-1 py-0.5 rounded"
                        style={{ background: "var(--accent-bg)", color: "var(--accent)" }}>you</span>}
                    </p>
                  </div>
                </div>

                {/* Email */}
                <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{u.email}</p>

                {/* Role selector */}
                <div className="relative w-28">
                  <select
                    value={u.role}
                    onChange={(e) => updateRole.mutate({ id: u.id, role: e.target.value })}
                    disabled={isMe}
                    className="appearance-none w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg pr-6 outline-none cursor-pointer disabled:cursor-default"
                    style={{
                      background: rc.bg,
                      color: rc.color,
                      border: `1px solid ${rc.border}`,
                    }}
                  >
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  {!isMe && (
                    <ChevronDown style={{ width: 10, height: 10, color: rc.color, position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
                  )}
                </div>

                {/* Active toggle */}
                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: u.is_active ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                      color: u.is_active ? "var(--success)" : "var(--danger)",
                      border: `1px solid ${u.is_active ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
                    }}
                  >
                    {u.is_active ? "Active" : "Disabled"}
                  </span>
                  {!isMe && (
                    <button
                      onClick={() => toggleActive.mutate(u.id)}
                      className="w-6 h-6 flex items-center justify-center rounded-lg transition-all"
                      style={{ color: "var(--text-faint)" }}
                      title={u.is_active ? "Disable user" : "Enable user"}
                      onMouseEnter={(e) => { e.currentTarget.style.background = u.is_active ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)"; e.currentTarget.style.color = u.is_active ? "#ef4444" : "var(--success)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-faint)"; }}
                    >
                      {u.is_active ? <UserX style={{ width: 13, height: 13 }} /> : <UserCheck style={{ width: 13, height: 13 }} />}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Roles legend */}
      <div
        className="rounded-xl p-4 grid grid-cols-3 gap-3"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        {[
          { role: "admin",   desc: "Full access: upload, repair, manage users, configure rules" },
          { role: "analyst", desc: "Can upload, profile, and repair datasets" },
          { role: "viewer",  desc: "Read-only: can view datasets and reports" },
        ].map(({ role, desc }) => {
          const rc = roleColors[role];
          return (
            <div key={role} className="flex items-start gap-2">
              <Shield style={{ width: 13, height: 13, marginTop: 1, color: rc.color, flexShrink: 0 }} />
              <div>
                <p className="text-xs font-semibold capitalize" style={{ color: rc.color }}>{role}</p>
                <p className="text-[10px] mt-0.5 leading-relaxed" style={{ color: "var(--text-muted)" }}>{desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
