"use client";

import { useState, useEffect } from "react";
import { createClient } from "../../lib/supabase/client";
import "./page.css";

type User = {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
  };
};

type Profile = {
  plan: string;
  display_name: string;
};

type Stats = {
  total_sessions: number;
  completed_sessions: number;
  avg_score: number;
  best_score: number;
  completion_rate: number;
  unique_concepts: number;
  recent_concepts: string[];
};

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sessions, setSessions] = useState<Array<{ id: string; concept: string; created_at: string; status: string }>>([]);

  // Profile editing
  const [displayName, setDisplayName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Stats loading
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setUser(user as User);
        setDisplayName(user.user_metadata?.full_name || "");

        // Fetch profile
        const profileRes = await fetch("/api/profile");
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile({
            plan: profileData.plan || "free",
            display_name: profileData.display_name || "",
          });
        }

        // Fetch stats
        setStatsLoading(true);
        const statsRes = await fetch("/api/stats");
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
        setStatsLoading(false);

        // Fetch sessions for sidebar
        const { data: sessionsData } = await supabase
          .from("sessions")
          .select("id, concept, created_at, status")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20);

        if (sessionsData) setSessions(sessionsData);
      }
    } catch (err) {
      console.log("Error fetching user:", err);
      setStatsLoading(false);
    }
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
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: displayName.trim() }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update name");
      }

      const data = await res.json();
      setProfile(prev => prev ? { ...prev, display_name: data.display_name } : null);
      setUser(prev => prev ? {
        ...prev,
        user_metadata: { ...prev.user_metadata, full_name: data.display_name }
      } : null);
      setIsEditingName(false);
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

  const formatDate = (dateStr: string) => {
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
  };

  const getInitials = (name: string | undefined, email: string) => {
    if (name) {
      const parts = name.split(" ");
      if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      return name.slice(0, 2).toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
  };

  const loadSession = (sessionId: string) => {
    window.location.href = `/feynman?session=${sessionId}`;
  };

  const deleteSession = async (sessionIdToDelete: string) => {
    try {
      const res = await fetch(`/api/deletesession/${sessionIdToDelete}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to delete session");
      }

      setSessions(prev => prev.filter(s => s.id !== sessionIdToDelete));
    } catch (err) {
      console.log("Error deleting session:", err);
    }
  };

  return (
    <div className="app-layout">
      {/* Mobile Hamburger */}
      <button className="hamburger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12h18M3 6h18M3 18h18" />
        </svg>
      </button>

      <button
        className={`sidebar-show-btn ${sidebarCollapsed ? "visible" : ""}`}
        onClick={() => setSidebarCollapsed(false)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      <div className={`sidebar-overlay ${mobileMenuOpen ? "visible" : ""}`} onClick={() => setMobileMenuOpen(false)} />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarCollapsed ? "collapsed" : ""} ${mobileMenuOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-header">
          <button className="sidebar-toggle" onClick={() => setSidebarCollapsed(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        </div>

        <div className="profile-section">
          <div className="profile-info">
            <div className="profile-avatar">
              {user ? getInitials(user.user_metadata?.full_name, user.email) : "?"}
            </div>
            <div className="profile-details">
              <div className="profile-name">{user?.user_metadata?.full_name || "User"}</div>
              <div className="profile-email">{user?.email || "No email"}</div>
              <span className={`profile-plan ${profile?.plan === "free" ? "free" : ""}`}>
                {profile?.plan || "Free"} Plan
              </span>
            </div>
          </div>
        </div>

        <div className="new-session-section">
          <a href="/feynman" className="new-session-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Session
          </a>
        </div>

        <div className="history-section">
          <div className="history-header">History</div>
          <div className="history-list">
            {sessions.length === 0 ? (
              <div className="history-empty">No sessions yet</div>
            ) : (
              sessions.map((session) => (
                <div key={session.id} className="history-item" onClick={() => loadSession(session.id)}>
                  <div className="history-item-content">
                    <span className="history-concept">{session.concept}</span>
                    <span className="history-date">{formatDate(session.created_at)}</span>
                  </div>
                  <button
                    className="history-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(session.id);
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="sidebar-footer">
          <a href="/feynman/settings" className="sidebar-link active">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Settings
          </a>
          <div className="sidebar-link logout" onClick={handleLogout}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className={`main-wrapper ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>

        {/* Logo */}
        <a href="/feynman" className="logo">
          <span className="logo-the">The</span>
          <span className="logo-script">Feynman</span>
        </a>

        {/* ── SETTINGS CONTENT ── */}
        <div className="main-content settings-content">
          <h1 className="settings-title">Settings</h1>

          {/* Save message */}
          {saveMessage && (
            <div className={`save-message ${saveMessage.type}`}>
              {saveMessage.text}
              <button onClick={() => setSaveMessage(null)} className="dismiss-btn">×</button>
            </div>
          )}

          {/* Profile Section */}
          <section className="settings-section">
            <h2 className="settings-section-title">Profile</h2>
            <div className="settings-card">
              <div className="settings-field">
                <label className="settings-label">Display Name</label>
                {isEditingName ? (
                  <div className="settings-edit-row">
                    <input
                      type="text"
                      className="settings-input"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your name"
                      maxLength={50}
                      autoFocus
                    />
                    <div className="settings-edit-actions">
                      <button className="settings-btn secondary" onClick={handleCancelEdit}>
                        Cancel
                      </button>
                      <button
                        className="settings-btn primary"
                        onClick={handleSaveName}
                        disabled={isSaving || !displayName.trim()}
                      >
                        {isSaving ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="settings-display-row">
                    <span className="settings-value">{user?.user_metadata?.full_name || "Not set"}</span>
                    <button className="settings-edit-btn" onClick={() => setIsEditingName(true)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Edit
                    </button>
                  </div>
                )}
              </div>

              <div className="settings-field">
                <label className="settings-label">Email</label>
                <span className="settings-value">{user?.email || "No email"}</span>
              </div>

              <div className="settings-field">
                <label className="settings-label">Plan</label>
                <span className={`settings-value plan-badge ${profile?.plan === "free" ? "free" : ""}`}>
                  {profile?.plan || "Free"} Plan
                </span>
              </div>
            </div>
          </section>

          {/* Stats Section */}
          <section className="settings-section">
            <h2 className="settings-section-title">Learning Stats</h2>
            {statsLoading ? (
              <div className="settings-card loading">
                <div className="loading-spinner"></div>
                <span>Loading stats...</span>
              </div>
            ) : stats ? (
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-number">{stats.total_sessions}</div>
                  <div className="stat-label">Total Sessions</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{stats.completed_sessions}</div>
                  <div className="stat-label">Completed</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{stats.avg_score}</div>
                  <div className="stat-label">Avg Score</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{stats.best_score}</div>
                  <div className="stat-label">Best Score</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{stats.completion_rate}%</div>
                  <div className="stat-label">Completion Rate</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number">{stats.unique_concepts}</div>
                  <div className="stat-label">Concepts Explored</div>
                </div>
              </div>
            ) : (
              <div className="settings-card empty">
                <p>No stats available yet. Start a session to see your learning progress!</p>
              </div>
            )}
          </section>

          {/* Account Section */}
          <section className="settings-section">
            <h2 className="settings-section-title">Account</h2>
            <div className="settings-card">
              <div className="settings-field">
                <label className="settings-label">Change Password</label>
                <span className="settings-value">
                  <a href="#" className="settings-link" onClick={(e) => {
                    e.preventDefault();
                    // Supabase password reset would go here
                    alert("Password reset feature coming soon!");
                  }}>
                    Reset your password
                  </a>
                </span>
              </div>
              <div className="settings-field">
                <label className="settings-label">Sign Out</label>
                <button className="settings-btn danger" onClick={handleLogout}>
                  Sign Out
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
