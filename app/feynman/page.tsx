"use client";

import { useState, useEffect, useRef, useTransition } from "react";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const initialized = useRef(false);

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
  const [, startTransition] = useTransition();
  const [charCount, setCharCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isReviewMode, setIsReviewMode] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scoreSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    const hasScore = messages.some(m => m.role === "ai" && m.content.startsWith("__SCORE__"));
    if (hasScore && scoreSectionRef.current) {
      setTimeout(() => {
        scoreSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    }
  }, [messages]);

  const fetchUserData = async () => {
    try {
      const supabase = createClient();
      const [userResult, profileRes, sessionsRes] = await Promise.all([
        supabase.auth.getUser(),
        fetch("/api/profile"),
        fetch("/api/getsession"),
      ]);
      const { data: { user }, error: authError } = userResult;
      if (authError || !user) return;
      setUser(user as User);
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile({ plan: profileData.plan || "free" });
      } else {
        setProfile({ plan: "free" });
      }
      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        if (sessionsData.sessions) setSessions(sessionsData.sessions as Session[]);
      }
    } catch (err) {
      console.log("Error fetching user:", err);
    }
  };

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
      const displayMessages = messages.map((m: { role: string; content: string }) => ({
        role: m.role === 'assistant' ? 'ai' : 'user' as const,
        content: m.content,
      }));
      const passedIndices = criteria_results
        .filter((c: { passed: boolean }) => c.passed)
        .map((c: { criterion_index: number }) => c.criterion_index);
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
        setMessages(prev => [...prev, {
          role: 'ai' as const,
          content: `__SCORE__${JSON.stringify({
            score: session.final_score,
            label: session.score_label,
            description: session.score_description,
            strengths: [],
          })}`,
        }]);
      } else {
        setStage(2);
        setIsReviewMode(false);
        const allCriteriaMet = passedIndices.length === 5;
        if (allCriteriaMet) {
          setCoachingDone(true);
          setMessages(prev => [...prev, { role: 'ai', content: `Now write your best, complete explanation of ${session.concept}. Put everything together — no notes, just you.` }]);
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionIdParam = params.get("session");
    if (sessionIdParam) {
      window.history.replaceState({}, "", "/feynman");
      startTransition(() => { loadSession(sessionIdParam); });
    }
  }, []);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    fetchUserData();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
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
      setSessions(prevSessions =>
        prevSessions.filter(session => session.id !== sessionIdToDelete)
      );
      if (sessionId === sessionIdToDelete) {
        setSessionId(null);
        setMessages([]);
        setApiMessages([]);
        setStage(1);
        setConcept('');
        setConceptConfirmed(false);
        setCoachingDone(false);
        setFinalSubmitted(false);
        setPassed([]);
        setIsReviewMode(false);
      }
    } catch {
      setError("Failed to delete session");
    }
  };

  const handleConceptSubmit = async () => {
    const trimmed = input.trim();
    if (!trimmed || trimmed.length < 3) return;
    setIsLoading(true);
    setError(null);
    try {
      const sessionRes = await fetch("/api/newsession", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concept: trimmed }),
      });
      if (!sessionRes.ok) {
        const errData = await sessionRes.json();
        if (sessionRes.status === 403 && errData.upgrade) {
          setError("Daily limit reached. Upgrade to Pro for unlimited sessions.");
        } else {
          throw new Error(errData.error || "Failed to create session");
        }
        setIsLoading(false);
        return;
      }
      const sessionData = await sessionRes.json();
      setSessionId(sessionData.id);
      setConcept(trimmed);
      setConceptConfirmed(true);
      setInput("");
      setCharCount(0);
      setStage(2);
      setMessages([{ role: "user", content: trimmed }]);
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
        body: JSON.stringify({ concept, finalExplanation: trimmed, session_id: sessionId }),
      });
      const data = await res.json();
      setStage(5);
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
        if (data.praise) {
          setMessages((prev) => [...prev, { role: "ai", content: data.praise }]);
          setApiMessages((prev) => [...prev, { role: "assistant", content: data.praise }]);
        }
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
    setIsReviewMode(false);
    setError(null);
  };

  const handleInputChange = (val: string) => {
    setInput(val);
    setCharCount(val.length);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

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

  const isWritingWell = !conceptConfirmed && messages.length === 0 && !error;

  return (
    <div className="flex h-screen w-full bg-background text-on-background overflow-hidden selection:bg-primary/10 selection:text-primary">
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-[280px] flex flex-col py-12 z-50 bg-transparent border-r border-outline-variant/20">
        {/* Profile */}
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

        {/* New Session */}
        <div className="px-8 mb-12">
          <button
            onClick={() => { resetSession(); setMobileMenuOpen(false); }}
            className="flex items-center gap-3 text-primary font-body text-[11px] tracking-[0.2em] uppercase group transition-all duration-300"
          >
            <span className="material-symbols-outlined text-[20px] group-hover:rotate-90 transition-transform duration-500">add</span>
            <span className="border-b border-primary/20 group-hover:border-primary pb-1">NEW SESSION</span>
          </button>
        </div>

        {/* History */}
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

        {/* Footer */}
        <div className="mt-auto pt-6 px-8 flex flex-col gap-4">
          <a
            href="/feynman/settings"
            className="flex items-center gap-3 text-on-surface-variant/50 font-body text-[10px] uppercase tracking-widest hover:text-primary transition-colors duration-200"
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
      <main className="flex-grow ml-[280px] bg-[#f9f9f7] relative flex flex-col items-center min-h-screen overflow-y-auto">
        {/* Mobile hamburger */}
        <button
          className="fixed top-4 left-4 z-50 hidden max-lg:flex items-center justify-center w-10 h-10 bg-white border border-outline-variant/30 rounded-lg text-primary"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>

        {/* Header */}
        <header className="max-w-writing-well w-full flex flex-col items-center pt-16 px-gutter z-10">
          <div
            className="text-display-lg font-display italic text-primary dark:text-primary select-none text-center leading-none mb-4"
            style={{ fontSize: "clamp(36px, 6vw, 56px)" }}
          >
            The Feynman
          </div>
          {/* Progress */}
          <div className="w-20 h-[1px] bg-outline-variant/30 relative">
            <div
              className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full transition-colors duration-500 ${stage >= 1 ? "bg-primary" : "bg-outline-variant/30"}`}
            />
          </div>
        </header>

        {/* Content */}
        {isWritingWell ? (
          /* ── Writing Well (empty state) ── */
          <div className="max-w-writing-well w-full flex-grow flex flex-col justify-center px-gutter py-10 fade-in">
            <div className="mb-10 text-center">
              <p className="text-[clamp(16px,2.5vw,24px)] font-display text-on-surface-variant/40 leading-relaxed font-light italic">
                Pick any concept — physics, history, business, or code.<br />The Feynman technique works on anything.
              </p>
            </div>
            <div className="relative group">
              <textarea
                ref={textareaRef}
                className="w-full min-h-[120px] bg-transparent border-0 border-b border-primary/10 focus:border-primary/10 focus:ring-0 text-[clamp(18px,2.5vw,24px)] font-display placeholder:text-outline-variant/30 placeholder:italic transition-all duration-700 resize-none py-6 text-center overflow-hidden no-scrollbar"
                value={input}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter a concept…"
                maxLength={4000}
                autoFocus
              />
              <div className="mt-12 flex flex-col items-center gap-8">
                <span className="font-body text-[10px] text-on-surface-variant/30 tracking-[0.3em]">
                  {charCount} / 4000
                </span>
                <button
                  onClick={handleSubmit}
                  disabled={submitDisabled}
                  className="bg-primary hover:bg-[#0d3323] text-on-primary font-body text-[11px] tracking-[0.4em] uppercase px-14 py-4 submit-btn-shadow active:scale-95 transition-all duration-500 rounded-full disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  START MASTERY
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ── Session View ── */
          <div className="max-w-writing-well w-full flex-grow flex flex-col px-gutter py-8 fade-in">
            {/* Error */}
            {error && (
              <div className="error-message rounded-lg p-4 mb-6 flex justify-between items-center">
                <p className="text-error text-[14px] font-body">{error}</p>
                <button onClick={() => setError(null)} className="text-error underline text-[13px] font-body">Dismiss</button>
              </div>
            )}

            {/* Review mode header */}
            {isReviewMode && (
              <div className="flex items-center gap-3 p-4 bg-surface-container-lowest rounded-lg mb-8 border border-outline-variant/20">
                <span className="font-body text-[10px] tracking-[0.14em] uppercase text-on-surface-variant/60 bg-primary/10 px-2.5 py-1 rounded">Review</span>
                <span className="font-display text-[20px] text-on-background">{concept}</span>
              </div>
            )}

            {/* Criteria pills */}
            {conceptConfirmed && !coachingDone && passed.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {CRITERIA_LABELS.map((label, i) => (
                  <span
                    key={i}
                    className={`font-body text-[10px] tracking-[0.1em] uppercase px-3 py-1.5 rounded-full border ${passed.includes(i) ? "pill-pass" : "pill-pending"}`}
                  >
                    {label}
                  </span>
                ))}
              </div>
            )}

            {/* Score section */}
            {(() => {
              const scoreMsg = messages.find(m => m.role === "ai" && m.content.startsWith("__SCORE__"));
              if (!scoreMsg) return null;
              const data = JSON.parse(scoreMsg.content.replace("__SCORE__", ""));
              const scoreIndex = messages.indexOf(scoreMsg);
              const questionCount = messages.slice(0, scoreIndex).filter(m => m?.role === "user").length;
              const criteriaMet = passed.length;
              const statusReady = criteriaMet === 5;
              const encouragementMap: Record<string, string> = {
                "Expert-level clarity": "Brilliant work! You've truly mastered this concept.",
                "Strong understanding": "Great job! You have a solid grasp with room to refine.",
                "Good grasp": "Nice progress! Keep building on what you know.",
                "Developing understanding": "You're getting there — keep exploring the gaps.",
                "Keep exploring": "Every attempt builds understanding. Try again!",
              };
              const encouragement = encouragementMap[data.label] || "Well done! Keep learning and growing.";
              return (
                <div ref={scoreSectionRef} className="w-full pb-8 mb-6 border-b border-outline-variant/20">
                  <div className="grid grid-cols-3 gap-4 mb-6 max-sm:grid-cols-1">
                    <div className="bg-primary-container/80 rounded-xl p-5 text-center">
                      <div className="font-display text-[2rem] text-white mb-1">{criteriaMet}/5</div>
                      <div className="font-body text-[10px] text-white/85 uppercase tracking-wider">Criteria Met</div>
                    </div>
                    <div className="bg-primary-container/80 rounded-xl p-5 text-center">
                      <div className="font-display text-[2rem] text-white mb-1">{questionCount}</div>
                      <div className="font-body text-[10px] text-white/85 uppercase tracking-wider">Questions Asked</div>
                    </div>
                    <div className="bg-primary-container/80 rounded-xl p-5 text-center">
                      <div className={`font-display text-[2rem] mb-1 ${statusReady ? "text-white" : "text-white/75"}`}>
                        {statusReady ? "Ready" : "In Progress"}
                      </div>
                      <div className="font-body text-[10px] text-white/85 uppercase tracking-wider">Status</div>
                    </div>
                  </div>
                  <div className="bg-primary/8 border-l-4 border-primary rounded-r-lg p-4 mb-6">
                    <p className="font-display text-[18px] italic text-primary leading-tight">{encouragement}</p>
                  </div>
                  <div className="flex flex-col items-center text-center bg-surface-container-lowest rounded-xl p-8 shadow-[0_2px_12px_rgba(20,66,45,0.1)]">
                    <div className="font-display text-[80px] text-primary leading-none mb-2">{data.score}</div>
                    <div className="font-body text-[14px] tracking-[0.16em] uppercase text-on-surface-variant mb-6">{data.label}</div>
                    <p className="font-display text-[20px] italic text-on-background leading-relaxed max-w-[680px] mb-6">{data.description}</p>
                    <div className="flex flex-col gap-2 w-full max-w-md">
                      {data.strengths?.map((s: string, j: number) => (
                        <div key={j} className="flex items-center gap-3 font-display text-[18px] text-on-background">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                          {s}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={resetSession}
                      className="mt-8 bg-primary hover:bg-[#0d3323] text-on-primary font-body text-[11px] tracking-[0.22em] uppercase px-10 py-4 rounded-full transition-all duration-300"
                    >
                      New concept
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Chat messages */}
            <div className="chat-area flex flex-col gap-6 flex-1 overflow-y-auto pb-4">
              {messages.map((msg, i) => {
                if (!msg?.content) return null;
                if (msg.role === "ai" && msg.content.startsWith("__SCORE__")) return null;
                return msg.role === "ai" ? (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-[3px] min-h-[18px] bg-primary flex-shrink-0 mt-1.5 rounded-full" />
                    <p className="msg-ai-text font-display italic text-on-surface-variant/80 leading-[1.7] max-w-[700px]">{msg.content}</p>
                  </div>
                ) : (
                  <p key={i} className="msg-user font-display text-on-background leading-[1.6] pl-4">{msg.content}</p>
                );
              })}
              {isLoading && (
                <div className="flex gap-1.5 items-center pl-4">
                  <span className="w-[5px] h-[5px] bg-outline-variant rounded-full" />
                  <span className="w-[5px] h-[5px] bg-outline-variant rounded-full" />
                  <span className="w-[5px] h-[5px] bg-outline-variant rounded-full" />
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input area */}
            {!finalSubmitted && !isReviewMode && (
              <div className="mt-auto pt-6 border-t border-outline-variant/10">
                <div className="flex flex-col gap-4">
                  <textarea
                    ref={textareaRef}
                    className="w-full bg-transparent border-0 border-b border-primary/10 focus:border-primary focus:ring-0 text-[clamp(17px,2vw,22px)] font-display placeholder:text-outline-variant/30 placeholder:italic transition-all duration-500 resize-none py-3 no-scrollbar"
                    value={input}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    rows={coachingDone ? 5 : 3}
                    maxLength={4000}
                    autoFocus
                  />
                  <div className="flex items-center justify-between">
                    <span className={`font-body text-[10px] tracking-[0.3em] ${charCount > 0 ? "text-primary" : "text-on-surface-variant/30"}`}>
                      {charCount} / 4000
                    </span>
                    <button
                      onClick={handleSubmit}
                      disabled={submitDisabled}
                      className="bg-primary hover:bg-[#0d3323] text-on-primary font-body text-[11px] tracking-[0.4em] uppercase px-12 py-4 submit-btn-shadow active:scale-95 transition-all duration-500 rounded-full disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      {isLoading ? "…" : coachingDone && !finalSubmitted ? "RATE MY UNDERSTANDING" : "SUBMIT"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="w-full max-w-writing-well px-gutter pb-6 text-on-surface-variant/20 flex justify-between items-center text-[9px] font-body tracking-[0.2em] uppercase mt-auto">
          <span>Academic Excellence</span>
          <span>System v4.1.0</span>
        </footer>
      </main>
    </div>
  );
}
