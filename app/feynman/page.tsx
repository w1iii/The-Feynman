"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "../lib/supabase/client";
import "./page.css";

type Session = {
  id: string;
  concept: string;
  created_at: string;
  status: string;
  final_score?: number;
};

type User = {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
  };
};

type Profile = {
  plan: string;
};

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

function getInitials(name: string | undefined, email: string) {
  if (name) {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

export default function FeynmanPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUser(user as User);
        
        const { data: profileData } = await supabase
          .from("profiles")
          .select("plan")
          .eq("id", user.id)
          .single();
        
        if (profileData) {
          setProfile(profileData);
        }

        const { data: sessionsData } = await supabase
          .from("sessions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20);

        if (sessionsData) {
          setSessions(sessionsData as Session[]);
        }
      }
    } catch (err) {
      console.log("Error fetching user:", err);
    } 
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="app-layout">
      {/* Mobile Hamburger */}
      <button className="hamburger" onClick={toggleMobileMenu}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 12h18M3 6h18M3 18h18" />
        </svg>
      </button>

      {/* Sidebar Toggle Button (shows when sidebar is collapsed) */}
      <button 
        className={`sidebar-show-btn ${sidebarCollapsed ? "visible" : ""}`}
        onClick={toggleSidebar}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      {/* Mobile Overlay */}
      <div 
        className={`sidebar-overlay ${mobileMenuOpen ? "visible" : ""}`} 
        onClick={closeMobileMenu}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarCollapsed ? "collapsed" : ""} ${mobileMenuOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-header">
          <button className="sidebar-toggle" onClick={toggleSidebar}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        </div>

        {/* Profile Section */}
        <div className="profile-section">
          <div className="profile-info">
            <div className="profile-avatar">
              {user ? getInitials(user.user_metadata?.full_name, user.email) : "?"}
            </div>
            <div className="profile-details">
              <div className="profile-name">
                {user?.user_metadata?.full_name || "User"}
              </div>
              <div className="profile-email">
                {user?.email || "No email"}
              </div>
              <span className={`profile-plan ${profile?.plan === "free" ? "free" : ""}`}>
                {profile?.plan || "Free"} Plan
              </span>
            </div>
          </div>
        </div>

        {/* History Section */}
        <div className="history-section">
          <div className="history-header">History</div>
          <div className="history-list">
            {sessions.length === 0 ? (
              <div className="history-empty">No sessions yet</div>
            ) : (
              sessions.map((session) => (
                <div 
                  key={session.id} 
                  className="history-item"
                  onClick={() => {
                    // TODO: View past session
                    closeMobileMenu();
                  }}
                >
                  <span className="history-concept">{session.concept}</span>
                  <span className="history-date">{formatDate(session.created_at)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <div className="sidebar-link" onClick={closeMobileMenu}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Settings
          </div>
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

      {/* Main Content */}
      <div className={`main-wrapper ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        
        {/* ═══════════════════════════════════════
             STEP 1 — CHOOSE CONCEPT
        ═════════════════════════════════════════ */}
        <section className="screen" id="s1">

          <a href="#s1" className="logo">
            <span className="logo-the">The</span>
            <span className="logo-script">Feynman</span>
          </a>

          <div className="dots">
            <span className="dot active"></span>
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>

          <div className="body">
            <div className="hint-row">
              <div className="cursor"></div>
              <p className="hint">
                Pick any concept — a physics principle, a historical event,
                a business idea, a coding pattern. The Feynman technique works on anything.
              </p>
            </div>

            <input
              className="ghost-input"
              type="text"
              id="concept-input"
              placeholder="Enter a concept…"
              autoComplete="off"
              maxLength={4000}
            />
          </div>

          <div className="bottom-bar">
            <span className="char-count">0 / 4000</span>
            <a className="btn" href="#s2">Submit</a>
          </div>

        </section>


        {/* ═══════════════════════════════════════
             STEP 2 — CHAT (was previously step 3)
        ═════════════════════════════════════════ */}
        <section className="screen" id="s2">

          <a href="#s1" className="logo">
            <span className="logo-the">The</span>
            <span className="logo-script">Feynman</span>
          </a>

          <div className="dots">
            <span className="dot done"></span>
            <span className="dot active"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>

          <div className="body" style={{ overflow: "hidden", gap: "16px" }}>

            <div className="chat-area">

              {/* AI opening message */}
              <div className="msg-ai">
                <div className="cursor"></div>
                <p className="msg-ai-text">
                  Great — explain Photosynthesis as if you&apos;re teaching a curious
                  12-year-old who has never heard of it. Close your notes. Your own words only.
                </p>
              </div>

              {/* User first answer */}
              <p className="msg-user">
                Photosynthesis is basically how plants make their food using sunlight.
                They take in air and water and turn it into energy somehow.
              </p>

              {/* AI follow-up */}
              <div className="msg-ai">
                <div className="cursor"></div>
                <p className="msg-ai-text">
                  Good start — you&apos;ve got the broad idea. You mentioned plants &quot;turn it into
                  energy somehow&quot; — can you walk me through what exactly is happening at that
                  point? What goes in, what comes out, and why?
                </p>
              </div>

              {/* Criteria pills after turn 1 */}
              <div className="pills">
                <span className="pill pass">Plain language</span>
                <span className="pill pend">Core mechanism</span>
                <span className="pill pend">Analogy or example</span>
                <span className="pill pend">No gaps or filler</span>
                <span className="pill pend">Child-friendly</span>
              </div>

              {/* User second answer */}
              <p className="msg-user">
                Right — so the plant takes CO₂ from the air and water from the soil.
                Sunlight hits the green parts of the leaf, which have chlorophyll, and that
                energy is used to split the water apart. The hydrogen from the water combines
                with the CO₂ to build glucose — that is the food. The leftover oxygen from
                the water gets released into the air, which is what we breathe.
              </p>

              {/* Loading indicator */}
              <div className="loading-dots">
                <span></span><span></span><span></span>
              </div>

            </div>

            {/* Input area */}
            <textarea
              className="ghost-input"
              rows={3}
              placeholder="Write your explanation…"
              maxLength={4000}
            ></textarea>

          </div>

          <div className="bottom-bar">
            <span className="char-count">0 / 4000</span>
            <a className="btn" href="#s2">Submit</a>
          </div>

          <div className="bottom-left">
            <a className="btn-ghost" href="#s1">← New concept</a>
          </div>

        </section>


        {/* ═══════════════════════════════════════
             STEP 3 — SUMMARY (was previously step 4)
        ═════════════════════════════════════════ */}
        <section className="screen" id="s3">

          <a href="#s1" className="logo">
            <span className="logo-the">The</span>
            <span className="logo-script">Feynman</span>
          </a>

          <div className="dots">
            <span className="dot done"></span>
            <span className="dot done"></span>
            <span className="dot active"></span>
            <span className="dot"></span>
          </div>

          <div className="s4-body">

            <div className="summary-title">Write your best.</div>

            {/* Criteria checklist */}
            <div className="crit-list">
              <div className="crit-row">
                <span className="crit-icon pass">✓</span>
                <div>
                  <div className="crit-name">Plain language</div>
                  <div className="crit-sub">No unexplained jargon throughout</div>
                </div>
              </div>
              <div className="crit-row">
                <span className="crit-icon pass">✓</span>
                <div>
                  <div className="crit-name">Core mechanism</div>
                  <div className="crit-sub">Inputs, outputs, and process explained step by step</div>
                </div>
              </div>
              <div className="crit-row">
                <span className="crit-icon fail">○</span>
                <div>
                  <div className="crit-name">Analogy or example</div>
                  <div className="crit-sub">Still missing — connect it to something familiar</div>
                </div>
              </div>
              <div className="crit-row">
                <span className="crit-icon pass">✓</span>
                <div>
                  <div className="crit-name">No gaps or filler</div>
                  <div className="crit-sub">Concrete and specific throughout</div>
                </div>
              </div>
              <div className="crit-row">
                <span className="crit-icon pass">✓</span>
                <div>
                  <div className="crit-name">Child-friendly</div>
                  <div className="crit-sub">A 12-year-old could follow this</div>
                </div>
              </div>
            </div>

            {/* Best moment */}
            <div className="best-moment">
              <div className="best-eyebrow">Your best moment</div>
              <div className="best-quote">
                &quot;The leftover oxygen from the water gets released into the air —
                that&apos;s what we breathe.&quot;
              </div>
            </div>

            {/* Gap box (shown when not all criteria met) */}
            <div className="gap-box">
              <div className="gap-eyebrow">Address in your final explanation</div>
              1. Add an analogy — connect the process to something a child could picture.
              A factory, a kitchen, a solar panel — anything that makes the mechanism click.
            </div>

            <hr className="divider" />

            <p className="final-label">Your final explanation</p>
            <textarea
              className="ghost-input"
              rows={6}
              placeholder="Put it all together — your clearest, most complete explanation…"
              maxLength={4000}
            ></textarea>

          </div>

          <div className="bottom-bar">
            <span className="char-count">0 / 4000</span>
            <a className="btn" href="#s4">Rate my understanding</a>
          </div>

          <div className="bottom-left">
            <a className="btn-ghost" href="#s2">← Back to chat</a>
          </div>

        </section>


        {/* ═══════════════════════════════════════
             STEP 4 — SCORE (was previously step 5)
        ═════════════════════════════════════════ */}
        <section className="screen" id="s4">

          <a href="#s1" className="logo">
            <span className="logo-the">The</span>
            <span className="logo-script">Feynman</span>
          </a>

          <div className="dots">
            <span className="dot done"></span>
            <span className="dot done"></span>
            <span className="dot done"></span>
            <span className="dot active"></span>
          </div>

          <div className="body">

            <div className="score-num">88</div>
            <div className="score-label">Strong understanding</div>

            <p className="score-desc">
              Your explanation covered the inputs, outputs, and mechanism clearly.
              The solar-panel kitchen analogy made the concept stick. A minor gap
              was not mentioning the two-stage process inside the chloroplast —
              but overall this is a strong Feynman explanation.
            </p>

            <div className="strengths">
              <div className="strength">Strong analogy that maps directly to the concept</div>
              <div className="strength">Covers all key inputs and outputs accurately</div>
              <div className="strength">Child-friendly language throughout</div>
            </div>

          </div>

          <div className="bottom-bar">
            <a className="btn" href="#s1">New concept</a>
          </div>

          <div className="bottom-left">
            <a className="btn-ghost" href="#s3">← Review</a>
          </div>

        </section>

      </div>
    </div>
  );
}