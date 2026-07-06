"use client";

import { useState } from "react";
import { createClient } from "../../lib/supabase/client";
import { authFetch } from "../../lib/api/client";
import { useUser } from "../../lib/context/user-context";
import "../page.css";

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

export default function SettingsPage() {
  const { user, profile, sessions, stats, loading, refresh } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const startEditing = () => {
    setDisplayName(user?.user_metadata?.full_name || "");
    setIsEditingName(true);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const handleSaveName = async () => {
    if (!displayName.trim()) return;

    setIsSaving(true);
    setSaveMessage(null);

    try {
      const res = await authFetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: displayName.trim() }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update name");
      }

      setIsEditingName(false);
      refresh();
      setSaveMessage({ type: "success", text: "Name updated successfully" });
    } catch (err) {
      setSaveMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to update name" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setDisplayName(user?.user_metadata?.full_name || "");
    setIsEditingName(false);
    setSaveMessage(null);
  };

  const loadSession = (sessionId: string) => {
    window.location.assign(`/feynman?session=${sessionId}`);
  };

  const deleteSession = async (sessionIdToDelete: string) => {
    try {
      const res = await authFetch(`/api/deletesession/${sessionIdToDelete}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to delete session");
      }

      refresh();
    } catch (err) {
      console.log("Error deleting session:", err);
    }
  };

  return (
    <div className="flex h-screen w-full bg-background text-on-background overflow-hidden selection:bg-primary/10 selection:text-primary">
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full w-[280px] flex flex-col py-12 z-50 bg-background lg:bg-transparent border-r border-outline-variant/20 transition-transform duration-300 ease-in-out lg:translate-x-0 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="px-8 mb-12">
          <div className="flex flex-col gap-1">
            <span className="text-[20px] font-display italic text-primary leading-tight">
              {user?.user_metadata?.full_name || "User"}
            </span>
            <span className="text-[11px] font-body text-on-surface-variant/60 tracking-wider">
              {user?.email || ""}
            </span>
            <div className="mt-4 px-3 py-1 inline-block border border-outline-variant/30 rounded-full text-[9px] font-bold tracking-widest text-on-surface-variant/50 w-fit uppercase">
              {profile?.plan || "FREE"} PLAN
            </div>
          </div>
        </div>

        <div className="px-8 mb-12">
          <a
            href="/feynman"
            className="flex items-center gap-3 text-primary font-body text-[11px] tracking-[0.2em] uppercase group transition-all duration-300"
          >
            <span className="material-symbols-outlined text-[20px] group-hover:rotate-90 transition-transform duration-500">arrow_back</span>
            <span className="border-b border-primary/20 group-hover:border-primary pb-1">BACK TO APP</span>
          </a>
        </div>

        <nav className="flex-grow overflow-y-auto custom-scrollbar px-0">
          <div className="px-8 mb-6 font-body text-[10px] text-outline-variant/60 uppercase tracking-[0.2em]">
            History
          </div>
          {sessions.length === 0 ? (
            <div className="px-8 font-body text-[13px] text-on-surface-variant/40 italic">
              No sessions yet
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => loadSession(session.id)}
                className="group flex items-center justify-between text-on-surface-variant/70 font-body text-[14px] px-8 py-3 hover:text-primary transition-colors duration-300 cursor-pointer"
              >
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="truncate">{session.concept}</span>
                  <span className="text-[11px] text-on-surface-variant/40">{formatDate(session.created_at)}</span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
                  className="opacity-0 group-hover:opacity-100 text-on-surface-variant/40 hover:text-error transition-all duration-200 flex-shrink-0 ml-2"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            ))
          )}
        </nav>

        <div className="mt-auto pt-6 px-8 flex flex-col gap-4">
          <a
            href="/feynman/settings"
            className="flex items-center gap-3 text-primary font-body text-[10px] uppercase tracking-widest transition-colors duration-200"
          >
            <span className="material-symbols-outlined text-[18px]">settings</span>
            <span>Settings</span>
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 text-on-surface-variant/50 font-body text-[10px] uppercase tracking-widest hover:text-primary transition-colors duration-200"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow lg:ml-[280px] bg-[#f9f9f7] relative flex flex-col items-center min-h-screen overflow-y-auto">
        {/* Mobile hamburger */}
        <button
          className="fixed top-4 left-4 z-50 flex lg:hidden items-center justify-center w-10 h-10 bg-white border border-outline-variant/30 rounded-lg text-primary shadow-md"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span className="material-symbols-outlined text-[24px]">{mobileMenuOpen ? "close" : "menu"}</span>
        </button>

        {/* Header */}
        <header className="max-w-writing-well w-full flex flex-col items-center pt-16 px-gutter z-10">
          <div
            className="font-display italic text-primary select-none text-center leading-none mb-4"
            style={{ fontSize: "clamp(28px, 5vw, 42px)" }}
          >
            Settings
          </div>
          <div className="w-16 h-[1px] bg-outline-variant/30 relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
          </div>
        </header>

        {/* Content */}
        <div className="max-w-writing-well w-full flex-grow flex flex-col px-gutter py-8 fade-in">
          {/* Save message */}
          {saveMessage && (
            <div className={`flex items-center justify-between p-3 rounded-lg mb-6 font-body text-[13px] ${
              saveMessage.type === "success"
                ? "bg-primary/10 text-primary border border-primary/20"
                : "bg-error-container text-error border border-error/20"
            }`}>
              <span>{saveMessage.text}</span>
              <button onClick={() => setSaveMessage(null)} className="opacity-60 hover:opacity-100 ml-4">&times;</button>
            </div>
          )}

          {/* Profile Section */}
          <section className="mb-8">
            <h2 className="font-body text-[10px] text-on-surface-variant/50 uppercase tracking-[0.15em] mb-3 pb-2 border-b border-outline-variant/20">Profile</h2>
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_2px_8px_rgba(20,66,45,0.06)]">
              <div className="mb-5">
                <label className="block font-body text-[11px] text-on-surface-variant/50 uppercase tracking-[0.1em] mb-2">Display Name</label>
                {isEditingName ? (
                  <div className="flex flex-wrap gap-3 items-center">
                    <input
                      type="text"
                      className="flex-1 min-w-[200px] px-3.5 py-2.5 border border-outline-variant/50 rounded-lg font-body text-[14px] text-on-background bg-transparent focus:outline-none focus:border-primary transition-colors"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your name"
                      maxLength={50}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button className="px-4 py-2.5 rounded-lg font-body text-[11px] uppercase tracking-[0.12em] text-on-surface-variant bg-outline-variant/20 hover:bg-outline-variant/40 transition-colors" onClick={handleCancelEdit}>
                        Cancel
                      </button>
                      <button
                        className="px-4 py-2.5 rounded-lg font-body text-[11px] uppercase tracking-[0.12em] text-on-primary bg-primary hover:bg-[#0d3323] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        onClick={handleSaveName}
                        disabled={isSaving || !displayName.trim()}
                      >
                        {isSaving ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    {loading ? (
                      <div className="animate-pulse bg-outline-variant/20 rounded h-5 w-36" />
                    ) : (
                      <span className="font-display text-[18px] text-on-background">{user?.user_metadata?.full_name || "Not set"}</span>
                    )}
                    <button className="flex items-center gap-1.5 text-primary font-body text-[11px] tracking-[0.1em] hover:underline" onClick={startEditing}>
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                      Edit
                    </button>
                  </div>
                )}
              </div>

              <div className="mb-5">
                <label className="block font-body text-[11px] text-on-surface-variant/50 uppercase tracking-[0.1em] mb-2">Email</label>
                {loading ? (
                  <div className="animate-pulse bg-outline-variant/20 rounded h-4 w-52" />
                ) : (
                  <span className="font-display text-[16px] text-on-background">{user?.email || "No email"}</span>
                )}
              </div>

              <div>
                <label className="block font-body text-[11px] text-on-surface-variant/50 uppercase tracking-[0.1em] mb-2">Plan</label>
                {loading ? (
                  <div className="animate-pulse bg-outline-variant/20 rounded-full h-5 w-16" />
                ) : (
                  <span className={`inline-block px-3 py-1 rounded-full font-body text-[11px] tracking-[0.08em] uppercase ${
                    profile?.plan === "free"
                      ? "bg-outline-variant/20 text-on-surface-variant/60"
                      : "bg-primary/10 text-primary"
                  }`}>
                    {profile?.plan || "Free"} Plan
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* Billing Section */}
          <section className="mb-8">
            <h2 className="font-body text-[10px] text-on-surface-variant/50 uppercase tracking-[0.15em] mb-3 pb-2 border-b border-outline-variant/20">Billing</h2>
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_2px_8px_rgba(20,66,45,0.06)]">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="font-body text-[11px] text-on-surface-variant/50 mb-1 uppercase tracking-[0.08em]">Plan</div>
                  <span className={`inline-block px-3 py-1 rounded-full font-body text-[11px] tracking-[0.08em] uppercase ${
                    profile?.plan === "free"
                      ? "bg-outline-variant/20 text-on-surface-variant/60"
                      : "bg-primary/10 text-primary"
                  }`}>
                    {profile?.plan || "Free"}
                  </span>
                </div>
              </div>
              <div className="mt-4 font-body text-[13px] text-on-surface-variant/50 italic">
                Billing coming soon
              </div>
            </div>
          </section>

          {/* Stats Section */}
          <section className="mb-8">
            <h2 className="font-body text-[10px] text-on-surface-variant/50 uppercase tracking-[0.15em] mb-3 pb-2 border-b border-outline-variant/20">Learning Stats</h2>
            {loading ? (
              <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_2px_8px_rgba(20,66,45,0.06)] flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-outline-variant/40 border-t-primary rounded-full animate-spin" />
                <span className="font-body text-[13px] text-on-surface-variant/60">Loading stats...</span>
              </div>
            ) : stats ? (
              <div className="grid grid-cols-3 max-sm:grid-cols-2 gap-3">
                <div className="bg-primary-container/80 rounded-xl p-5 text-center">
                  <div className="font-display text-[1.6rem] text-white mb-1">{stats.total_sessions}</div>
                  <div className="font-body text-[9px] text-white/85 uppercase tracking-wider">Total Sessions</div>
                </div>
                <div className="bg-primary-container/80 rounded-xl p-5 text-center">
                  <div className="font-display text-[1.6rem] text-white mb-1">{stats.completed_sessions}</div>
                  <div className="font-body text-[9px] text-white/85 uppercase tracking-wider">Completed</div>
                </div>
                <div className="bg-primary-container/80 rounded-xl p-5 text-center">
                  <div className="font-display text-[1.6rem] text-white mb-1">{stats.avg_score}</div>
                  <div className="font-body text-[9px] text-white/85 uppercase tracking-wider">Avg Score</div>
                </div>
                <div className="bg-primary-container/80 rounded-xl p-5 text-center">
                  <div className="font-display text-[1.6rem] text-white mb-1">{stats.best_score}</div>
                  <div className="font-body text-[9px] text-white/85 uppercase tracking-wider">Best Score</div>
                </div>
                <div className="bg-primary-container/80 rounded-xl p-5 text-center">
                  <div className="font-display text-[1.6rem] text-white mb-1">{stats.completion_rate}%</div>
                  <div className="font-body text-[9px] text-white/85 uppercase tracking-wider">Completion Rate</div>
                </div>
                <div className="bg-primary-container/80 rounded-xl p-5 text-center">
                  <div className="font-display text-[1.6rem] text-white mb-1">{stats.unique_concepts}</div>
                  <div className="font-body text-[9px] text-white/85 uppercase tracking-wider">Concepts Explored</div>
                </div>
              </div>
            ) : (
              <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_2px_8px_rgba(20,66,45,0.06)] text-center">
                <p className="font-body text-[13px] text-on-surface-variant/50 italic">No stats available yet. Start a session to see your learning progress!</p>
              </div>
            )}
          </section>

          {/* Account Section */}
          <section className="mb-8">
            <h2 className="font-body text-[10px] text-on-surface-variant/50 uppercase tracking-[0.15em] mb-3 pb-2 border-b border-outline-variant/20">Account</h2>
            <div className="bg-surface-container-lowest rounded-xl p-6 shadow-[0_2px_8px_rgba(20,66,45,0.06)]">
              <div className="mb-5">
                <label className="block font-body text-[11px] text-on-surface-variant/50 uppercase tracking-[0.1em] mb-2">Change Password</label>
                {passwordSuccess ? (
                  <p className="font-body text-[13px] text-on-surface-variant/70 italic">Password updated successfully.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {passwordError && (
                      <p className="font-body text-[12px] text-error">{passwordError}</p>
                    )}
                    <input
                      type="password"
                      placeholder="Current password"
                      className="w-full max-w-xs px-3.5 py-2 border border-outline-variant/50 rounded-lg font-body text-[14px] text-on-background bg-transparent focus:outline-none focus:border-primary transition-colors"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                    <input
                      type="password"
                      placeholder="New password"
                      className="w-full max-w-xs px-3.5 py-2 border border-outline-variant/50 rounded-lg font-body text-[14px] text-on-background bg-transparent focus:outline-none focus:border-primary transition-colors"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      minLength={6}
                    />
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      className="w-full max-w-xs px-3.5 py-2 border border-outline-variant/50 rounded-lg font-body text-[14px] text-on-background bg-transparent focus:outline-none focus:border-primary transition-colors"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      minLength={6}
                    />
                    <button
                      className="w-fit px-4 py-2 rounded-lg font-body text-[11px] uppercase tracking-[0.12em] text-on-primary bg-primary hover:bg-[#0d3323] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
                      onClick={async () => {
                        setPasswordError("");
                        if (newPassword !== confirmPassword) {
                          setPasswordError("Passwords do not match");
                          return;
                        }
                        if (newPassword.length < 6) {
                          setPasswordError("Password must be at least 6 characters");
                          return;
                        }
                        setPasswordLoading(true);
                        const supabase = createClient();
                        const { error } = await supabase.auth.updateUser({ password: newPassword });
                        setPasswordLoading(false);
                        if (error) {
                          setPasswordError(error.message);
                        } else {
                          setPasswordSuccess(true);
                          setCurrentPassword("");
                          setNewPassword("");
                          setConfirmPassword("");
                        }
                      }}
                    >
                      {passwordLoading ? "Updating..." : "Update password"}
                    </button>
                  </div>
                )}
              </div>
              <div>
                <label className="block font-body text-[11px] text-on-surface-variant/50 uppercase tracking-[0.1em] mb-2">Sign Out</label>
                <button className="px-4 py-2.5 rounded-lg font-body text-[11px] uppercase tracking-[0.12em] text-error bg-error-container hover:bg-error/10 transition-colors" onClick={handleLogout}>
                  Sign Out
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="w-full max-w-writing-well px-gutter pb-6 text-on-surface-variant/20 flex justify-between items-center text-[9px] font-body tracking-[0.2em] uppercase mt-auto">
          <span>Academic Excellence</span>
          <span>System v4.1.0</span>
        </footer>
      </main>
    </div>
  );
}
