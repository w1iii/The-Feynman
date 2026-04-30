"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "../lib/supabase/client";
import "./page.css";

type Message = {
  role: "ai" | "user";
  content: string;
};

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

// dot stages:
// 1 = entered concept
// 2 = coaching in progress
// 3 = all criteria met / coaching done
// 4 = final explanation written
// 5 = rated / complete
type Stage = 1 | 2 | 3 | 4 | 5;

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
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

const CRITERIA_LABELS = [
  "Plain language",
  "Core mechanism",
  "Analogy or example",
  "No gaps or filler",
  "Child-friendly",
];

export default function FeynmanPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const initialized = useRef(false);

  // ── conversation state ──
  const [concept, setConcept] = useState("");
  const [conceptConfirmed, setConceptConfirmed] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [apiMessages, setApiMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [passed, setPassed] = useState<number[]>([]);
  const [stage, setStage] = useState<Stage>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [coachingDone, setCoachingDone] = useState(false);
  const [finalSubmitted, setFinalSubmitted] = useState(false);
  const [score, setScore] = useState<{ score: number; label: string; description: string; strengths: string[] } | null>(null);
  const [charCount, setCharCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isReviewMode, setIsReviewMode] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  // ── scroll to bottom on new message ──
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      console.log("User:", user?.id);
      
      if (user) {
        setUser(user as User);
        
        // Fetch profile with plan via server API
        const profileRes = await fetch("/api/profile");
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          console.log("Profile data:", profileData);
          setProfile({ plan: profileData.plan || "free" });
        } else {
          console.log("Profile fetch failed, using default");
          setProfile({ plan: "free" });
        }
        
        // Fetch sessions
        const { data: sessionsData } = await supabase
          .from("sessions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20);
        
        if (sessionsData) setSessions(sessionsData as Session[]);
      }
    } catch (err) {
      console.log("Error fetching user:", err);
    }
  };

  // ── load a past session ──
  const loadSession = async (sessionId: string) => {
    setIsLoading(true);
    setError(null);
    setMobileMenuOpen(false);

    try {
      const res = await fetch(`/api/session/${sessionId}`);
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to load session");
      }

      const data = await res.json();
      const { session, messages, criteria_results } = data;

      // Convert messages to display format
      const displayMessages = messages.map((m: { role: string; content: string }) => ({
        role: m.role === 'assistant' ? 'ai' : 'user' as const,
        content: m.content,
      }));

      // Get passed criteria indices
      const passedIndices = criteria_results
        .filter((c: { passed: boolean }) => c.passed)
        .map((c: { criterion_index: number }) => c.criterion_index);

      // Build apiMessages from database messages for continuing conversation
      const loadedApiMessages = messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      setSessionId(session.id);
      setConcept(session.concept);
      setMessages(displayMessages);
      setApiMessages(loadedApiMessages);
      setPassed(passedIndices);
      setConceptConfirmed(true);

      if (session.status === 'completed' && session.final_score !== null) {
        setCoachingDone(true);
        setIsReviewMode(true);
        setStage(5);
        
        // Show score
        if (session.final_score !== null) {
          setScore({
            score: session.final_score,
            label: session.score_label || "Completed",
            description: session.score_description || "",
            strengths: [],
          });
          
          // Add score message
          setMessages(prev => [...prev, {
            role: 'ai' as const,
            content: `__SCORE__${JSON.stringify({
              score: session.final_score,
              label: session.score_label,
              description: session.score_description,
              strengths: [],
            })}`,
          }]);
        }
      } else {
        setStage(2);
        setIsReviewMode(false);
        
        // Check if all criteria met - coaching is done but still needs final explanation
        const allCriteriaMet = passedIndices.length === 5;
        if (allCriteriaMet) {
          setCoachingDone(true);
          // Ask for final explanation
          const finalPrompt = `Now write your best, complete explanation of ${session.concept}. Put everything together — no notes, just you.`;
          setMessages(prev => [...prev, { role: 'ai', content: finalPrompt }]);
        } else {
          setCoachingDone(false);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load session");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  // ── delete session ──
  const deleteSession = async (sessionIdToDelete: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionIdToDelete);

      if (error) throw error;

      // Remove from local state
      setSessions(prev => prev.filter(s => s.id !== sessionIdToDelete));

      // If deleting current session, reset
      if (sessionId === sessionIdToDelete) {
        resetSession();
      }
    } catch (err) {
      setError("Failed to delete session");
    }
  };

  // ── submit concept (first input) ──
  const handleConceptSubmit = async () => {
    const trimmed = input.trim();
    if (!trimmed || trimmed.length < 3) return;

    setIsLoading(true);
    setError(null);

    try {
      // Create session first
      const sessionRes = await fetch("/api/newsession", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concept: trimmed }),
      });

      if (!sessionRes.ok) {
        const errData = await sessionRes.json();
        throw new Error(errData.error || "Failed to create session");
      }

      const sessionData = await sessionRes.json();
      setSessionId(sessionData.id);

      setConcept(trimmed);
      setConceptConfirmed(true);
      setInput("");
      setCharCount(0);
      setStage(2);

      // show user's concept as first message
      setMessages([{ role: "user", content: trimmed }]);

      // auto-call coach with opening prompt
      const opening = { role: "user" as const, content: `I want to explain: ${trimmed}` };
      const history = [opening];
      setApiMessages(history);
      await callCoach(trimmed, history, sessionData.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStage(1);
      setConceptConfirmed(false);
    } finally {
      setIsLoading(false);
    }
  };

  // ── submit explanation during coaching ──
  const handleExplanationSubmit = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);

    const newApiMessages = [...apiMessages, { role: "user" as const, content: trimmed }];
    setApiMessages(newApiMessages);

    setInput("");
    setCharCount(0);
    if (sessionId) {
      await callCoach(concept, newApiMessages, sessionId);
    }
  };

  // ── submit final explanation ──
  const handleFinalSubmit = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const words = trimmed.split(/\s+/).length;
    if (words < 30) return;

    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setCharCount(0);
    setFinalSubmitted(true);
    setIsLoading(true);
    setStage(4);

    try {
      const res = await fetch("/api/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concept, finalExplanation: trimmed }),
      });
      const data = await res.json();
      setScore(data);
      setStage(5);

      // show score as AI message
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: `__SCORE__${JSON.stringify(data)}`,
        },
      ]);
    } catch {
      setMessages((prev) => [...prev, { role: "ai", content: "Something went wrong rating your explanation. Please try again." }]);
      setFinalSubmitted(false);
    } finally {
      setIsLoading(false);
    }
  };

  // ── coach API call ──
  const callCoach = async (
    conceptStr: string,
    history: { role: "user" | "assistant"; content: string }[],
    currentSessionId: string
  ) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, concept: conceptStr, session_id: currentSessionId }),
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to get response");
      }
      
      const data = await res.json();

      setPassed(data.passed ?? []);

      if (data.done) {
        setCoachingDone(true);
        setStage(3);

        // show praise
        if (data.praise) {
          setMessages((prev) => [...prev, { role: "ai", content: data.praise }]);
          setApiMessages((prev) => [...prev, { role: "assistant", content: data.praise }]);
        }

        // show gaps if any, then ask for final explanation
        const gapNote = data.gaps?.length
          ? `\n\nFor your final explanation, make sure to address: ${data.gaps.join(", ")}.`
          : "";

        const finalPrompt = `Now write your best, complete explanation of ${conceptStr}. Put everything together — no notes, just you.${gapNote}`;
        setMessages((prev) => [...prev, { role: "ai", content: finalPrompt }]);

      } else {
        setMessages((prev) => [...prev, { role: "ai", content: data.question }]);
        setApiMessages((prev) => [...prev, { role: "assistant", content: data.question }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "ai", content: "Something went wrong. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  // ── new session ──
  const resetSession = () => {
    setConcept("");
    setConceptConfirmed(false);
    setSessionId(null);
    setMessages([]);
    setApiMessages([]);
    setInput("");
    setCharCount(0);
    setPassed([]);
    setStage(1);
    setIsLoading(false);
    setCoachingDone(false);
    setFinalSubmitted(false);
    setScore(null);
    setIsReviewMode(false);
    setError(null);
  };

  // ── input handler ──
  const handleInputChange = (val: string) => {
    setInput(val);
    setCharCount(val.length);
  };

  // ── what submit does depends on stage ──
  const handleSubmit = () => {
    if (!conceptConfirmed) {
      handleConceptSubmit();
    } else if (coachingDone && !finalSubmitted) {
      handleFinalSubmit();
    } else if (!coachingDone) {
      handleExplanationSubmit();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const submitDisabled =
    isLoading ||
    input.trim().length < 3 ||
    (coachingDone && !finalSubmitted && input.trim().split(/\s+/).length < 30) ||
    finalSubmitted;

  const placeholder = !conceptConfirmed
    ? "Enter a concept…"
    : coachingDone && !finalSubmitted
    ? "Write your final, complete explanation… (min 30 words)"
    : "Write your explanation…";

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
          <button className="new-session-btn" onClick={() => { resetSession(); setMobileMenuOpen(false); }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Session
          </button>
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
          <div className="sidebar-link">
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

      {/* ── MAIN ── */}
      <div className={`main-wrapper ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>

        {/* Logo */}
        <a href="#" className="logo">
          <span className="logo-the">The</span>
          <span className="logo-script">Feynman</span>
        </a>

        {/* Step dots — top right, always visible */}
        <div className="dots">
          <span className={`dot ${stage >= 1 ? (stage > 1 ? "done" : "active") : ""}`}></span>
          <span className={`dot ${stage >= 2 ? (stage > 2 ? "done" : "active") : ""}`}></span>
          <span className={`dot ${stage >= 3 ? (stage > 3 ? "done" : "active") : ""}`}></span>
          <span className={`dot ${stage >= 4 ? (stage > 4 ? "done" : "active") : ""}`}></span>
          <span className={`dot ${stage >= 5 ? "active" : ""}`}></span>
        </div>

        {/* ── CONVERSATION AREA ── */}
        <div className="main-content">

          {/* Empty state — before concept entered */}
          {!conceptConfirmed && messages.length === 0 && (
            <div className="hint-row">
              <p className="hint">
                Pick any concept — a physics principle, a historical event,
                a business idea, a coding pattern. The Feynman technique works on anything.
              </p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={() => setError(null)}>Dismiss</button>
            </div>
          )}

          {/* Review mode header */}
          {isReviewMode && (
            <div className="review-header">
              <span className="review-label">Review</span>
              <span className="review-concept">{concept}</span>
            </div>
          )}

          {/* Criteria pills — visible during coaching */}
          {conceptConfirmed && !coachingDone && passed.length > 0 && (
            <div className="pills">
              {CRITERIA_LABELS.map((label, i) => (
                <span key={i} className={`pill ${passed.includes(i) ? "pass" : "pend"}`}>
                  {label}
                </span>
              ))}
            </div>
          )}

          {/* Chat messages */}
          <div className="chat-area">
            {messages.map((msg, i) => {
              if (!msg?.content) return null;
              
              // Score card message
              if (msg.role === "ai" && msg.content.startsWith("__SCORE__")) {
                const data = JSON.parse(msg.content.replace("__SCORE__", ""));
                return (
                  <div key={i} className="score-card">
                    <div className="score-num">{data.score}</div>
                    <div className="score-label-text">{data.label}</div>
                    <p className="score-desc">{data.description}</p>
                    <div className="strengths">
                      {data.strengths?.map((s: string, j: number) => (
                        <div key={j} className="strength">{s}</div>
                      ))}
                    </div>
                    <button className="btn" style={{ marginTop: "28px" }} onClick={resetSession}>
                      New concept
                    </button>
                  </div>
                );
              }

              return msg.role === "ai" ? (
                <div key={i} className="msg-ai">
                  <div className="cursor" style={{ animation: "none", opacity: 1 }}></div>
                  <p className="msg-ai-text">{msg.content}</p>
                </div>
              ) : (
                <p key={i} className="msg-user">{msg.content}</p>
              );
            })}

            <div ref={chatEndRef} />
          </div>

          {/* ── INPUT AREA ── */}
          {!finalSubmitted && !isReviewMode && (
            <div className="input-area">
              {/* Loading indicator below input */}
              {isLoading && (
                <div className="loading-dots" style={{ marginTop: '12px', marginLeft: '14px' }}>
                  <span></span><span></span><span></span>
                </div>
              )}
              
              <div className="input-row">
                <div className="cursor"></div>
                {!conceptConfirmed ? (
                  // Single line for concept
                  <input
                    ref={inputRef as React.RefObject<HTMLInputElement>}
                    className="ghost-input"
                    type="text"
                    value={input}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    autoComplete="off"
                    maxLength={4000}
                    autoFocus
                  />
                ) : (
                  // Textarea for explanations
                  <textarea
                    ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                    className="ghost-input"
                    value={input}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    rows={coachingDone ? 5 : 3}
                    maxLength={4000}
                    autoFocus
                  />
                )}
              </div>

              <div className="bottom-bar">
                <span className="char-count">{charCount} / 4000</span>
                <button
                  className="btn"
                  onClick={handleSubmit}
                  disabled={submitDisabled}
                >
                  {isLoading
                    ? "…"
                    : coachingDone && !finalSubmitted
                    ? "Rate my understanding"
                    : "Submit"}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
