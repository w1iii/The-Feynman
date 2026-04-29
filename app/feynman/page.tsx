"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "../lib/supabase/client";
import "./page.css";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Session = {
  id: string;
  concept: string;
  status: string;
  final_score?: number;
  score_label?: string;
};

type RatingResult = {
  score: number;
  label: string;
  description: string;
  strengths: string[];
};

const CRITERIA = [
  "Plain language — no unexplained jargon",
  "Core mechanism explained (how + why)",
  "At least one analogy or concrete example",
  "No critical gaps or vague filler",
  "A 12-year-old with no background could follow it",
];

function FeynmanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Step state (1-5)
  const [currentStep, setCurrentStep] = useState(1);

  // Session state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [concept, setConcept] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Criteria tracking
  const [passed, setPassed] = useState<number[]>([]);
  const [questionCount, setQuestionCount] = useState(0);

  // Rating state
  const [finalExplanation, setFinalExplanation] = useState("");
  const [rating, setRating] = useState<RatingResult | null>(null);

  // Modal state
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  // Initialize from URL
  useEffect(() => {
    const step = searchParams.get("step");
    if (step) {
      setCurrentStep(parseInt(step) || 1);
    }
  }, [searchParams]);

  // Fetch sessions on load
  useEffect(() => {
    fetchSessions();
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/getsession");
      const data = await res.json();
      if (data.sessions) {
        setSessions(data.sessions);
      }
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    }
  };

  // Step 1: Create new session
  const createSession = async () => {
    if (!concept.trim() || concept.length < 3) {
      setError("Please enter at least 3 characters");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/newsession", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concept }),
      });
      const data = await res.json();

      if (res.ok) {
        setSessionId(data.id);
        setMessages([]);
        setPassed([]);
        setQuestionCount(0);
        setRating(null);
        goToStep(2);
      } else if (data.upgrade) {
        setShowUpgradeModal(true);
      } else {
        setError(data.error || "Failed to create session");
      }
    } catch (err) {
      setError("Failed to create session");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Send message to coach
  const sendMessage = async () => {
    if (!input.trim() || !sessionId) return;

    const userMessage: Message = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          concept: concept,
          session_id: sessionId,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        if (data.question) {
          const assistantMessage: Message = { role: "assistant", content: data.question };
          setMessages([...newMessages, assistantMessage]);
        }
        if (data.passed) {
          setPassed(data.passed);
        }
        setQuestionCount(questionCount + 1);

        if (data.done) {
          // Save session data for step 4
          setTimeout(() => goToStep(4), 1500);
        }
      } else {
        setError(data.error || "Failed to get response");
      }
    } catch (err) {
      setError("Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Rate final explanation
  const submitRating = async () => {
    if (!finalExplanation.trim() || wordCount < 30) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concept,
          finalExplanation,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setRating(data);
        goToStep(5);
      } else {
        setError(data.error || "Failed to rate explanation");
      }
    } catch (err) {
      setError("Failed to rate explanation");
    } finally {
      setLoading(false);
    }
  };

  // Navigation helpers
  const goToStep = (step: number) => {
    setCurrentStep(step);
    router.push(`/feynman?step=${step}`);
  };

  const handleWordCount = (text: string) => {
    setFinalExplanation(text);
    setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "#22c55e";
    if (score >= 75) return "#84cc16";
    if (score >= 60) return "#eab308";
    if (score >= 45) return "#f97316";
    return "#ef4444";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Expert-level clarity";
    if (score >= 75) return "Strong understanding";
    if (score >= 60) return "Good grasp";
    if (score >= 45) return "Developing understanding";
    return "Keep exploring";
  };

  // Render progress dots
  const renderProgressDots = () => {
    return (
      <div className="flex space-x-1.5 px-4 py-2">
        {[1, 2, 3, 4, 5].map((step) => (
          <div
            key={step}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              step === currentStep
                ? "bg-primary-container scale-110"
                : step < currentStep
                ? "bg-primary-container"
                : "bg-secondary-container opacity-40"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      {/* TopNavBar */}
      <header className="header">
        <div className="header-content">
          <div className="flex items-center gap-2">
            <span className="font-serif text-lg tracking-tight text-primary">THE</span>
            <span className="font-serif italic text-2xl font-semibold text-primary">
              Feynman
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {renderProgressDots()}
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                router.push("/");
              }}
              className="text-primary cursor-pointer active:opacity-80 transition-opacity"
            >
              <span className="material-symbols-outlined">account_circle</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main">
        <div className="content">
          {/* ERROR MESSAGE */}
          {error && (
            <div className="error-message">
              {error}
              <button onClick={() => setError("")} className="error-close">
                ×
              </button>
            </div>
          )}

          {/* STEP 1: Concept Input */}
          {currentStep === 1 && (
            <div className="step-container">
              <div className="input-area">
                <textarea
                  className="concept-input"
                  placeholder="Pick any concept — a physics principle, a historical event, a business idea, a coding pattern. The Feynman technique works on anything."
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && e.ctrlKey && createSession()}
                />
                <div className="input-footer">
                  <span className="char-count">
                    {concept.length}/4000
                  </span>
                  <button
                    className="submit-btn"
                    onClick={createSession}
                    disabled={loading || concept.length < 3}
                  >
                    {loading ? "Creating..." : "Submit"}
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>
              </div>
              <p className="hint">
                Step 1: Write down what you know as if you were explaining it to a
                child.
              </p>
            </div>
          )}

          {/* STEP 2: Study Reminder */}
          {currentStep === 2 && (
            <div className="step-container">
              <div className="reminder-card">
                <div className="reminder-label">Your concept</div>
                <h2 className="reminder-concept">{concept}</h2>
                <p className="reminder-instruction">
                  Take a moment to gather your thoughts. When you&apos;re ready, start explaining as if
                  to a 12-year-old.
                </p>
                <div className="reminder-buttons">
                  <button
                    className="btn-secondary"
                    onClick={() => goToStep(1)}
                  >
                    Change concept
                  </button>
                  <button className="btn-primary" onClick={() => goToStep(3)}>
                    I&apos;m ready
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Coaching Chat */}
          {currentStep === 3 && (
            <div className="step-container">
              <div className="chat-container">
                <div className="chat-header">
                  <span className="chat-concept">{concept}</span>
                  <span className="chat-count">Q{questionCount}/20</span>
                </div>

                <div className="chat-messages">
                  {messages.length === 0 ? (
                    <div className="chat-empty">
                      <p>Start explaining your concept...</p>
                      <p className="text-sm opacity-70">
                        Explain it like you&apos;re teaching a 12-year-old with no prior
                        knowledge.
                      </p>
                    </div>
                  ) : (
                    messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`message ${msg.role}`}
                      >
                        <div className="message-label">
                          {msg.role === "user" ? "You" : "Coach"}
                        </div>
                        <div className="message-content">{msg.content}</div>
                      </div>
                    ))
                  )}
                  {loading && (
                    <div className="message assistant">
                      <div className="message-label">Coach</div>
                      <div className="message-content">
                        <span className="typing-indicator">Thinking...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="chat-input-area">
                  <textarea
                    className="chat-input"
                    placeholder="Type your explanation..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    disabled={loading}
                  />
                  <button
                    className="chat-send"
                    onClick={sendMessage}
                    disabled={loading || !input.trim()}
                  >
                    <span className="material-symbols-outlined">send</span>
                  </button>
                </div>
              </div>

              {/* Criteria Checklist */}
              <div className="criteria-panel">
                <h3 className="criteria-title">Criteria</h3>
                <ul className="criteria-list">
                  {CRITERIA.map((criterion, index) => (
                    <li
                      key={index}
                      className={`criterion-item ${
                        passed.includes(index) ? "passed" : ""
                      }`}
                    >
                      <span className="material-symbols-outlined">
                        {passed.includes(index)
                          ? "check_circle"
                          : "radio_button_unchecked"}
                      </span>
                      <span>{criterion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* STEP 4: Summary */}
          {currentStep === 4 && (
            <div className="step-container">
              <div className="summary-card">
                {passed.length === 5 ? (
                  <>
                    <h2 className="summary-title">
                      You&apos;re ready. Write your best.
                    </h2>
                    <div className="summary-stats">
                      <span className="stat-green">
                        {passed.length}/5
                      </span>
                      <span className="stat-label">Ready</span>
                      <span className="stat-count">{questionCount} questions</span>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="summary-title">
                      Good progress. Address these gaps.
                    </h2>
                    <div className="summary-stats">
                      <span className="stat-amber">
                        {passed.length}/5
                      </span>
                      <span className="stat-label">Unlocked</span>
                      <span className="stat-count">20 questions</span>
                    </div>
                  </>
                )}

                {/* Criteria rows */}
                <div className="criteria-rows">
                  {CRITERIA.map((criterion, index) => (
                    <div
                      key={index}
                      className={`criteria-row ${
                        passed.includes(index) ? "passed" : "unmet"
                      }`}
                    >
                      <span className="material-symbols-outlined">
                        {passed.includes(index)
                          ? "check_circle"
                          : "radio_button_unchecked"}
                      </span>
                      <span>{criterion}</span>
                    </div>
                  ))}
                </div>

                {/* Gaps for unmet criteria */}
                {passed.length < 5 && (
                  <div className="gaps-box">
                    <h4>Address these in your final explanation:</h4>
                    <ul>
                      {CRITERIA.map((criterion, index) =>
                        !passed.includes(index) ? (
                          <li key={index}>{criterion}</li>
                        ) : null
                      )}
                    </ul>
                  </div>
                )}

                {/* Final explanation textarea */}
                <div className="final-section">
                  <label className="final-label">
                    Write your final explanation
                  </label>
                  <textarea
                    className="final-textarea"
                    placeholder={
                      passed.length < 5
                        ? `Focus on: ${CRITERIA.filter(
                            (c, i) => !passed.includes(i)
                          ).join(", ")}`
                        : "Now write your best explanation..."
                    }
                    value={finalExplanation}
                    onChange={(e) => handleWordCount(e.target.value)}
                  />
                  <div className="final-footer">
                    <span className="word-count">
                      {wordCount} words {wordCount < 30 && "(minimum 30)"}
                    </span>
                    <button
                      className="rate-btn"
                      onClick={submitRating}
                      disabled={loading || wordCount < 30}
                    >
                      {loading ? "Rating..." : "Rate my understanding"}
                    </button>
                  </div>
                </div>

                <button
                  className="review-btn"
                  onClick={() => goToStep(3)}
                >
                  Review coaching
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Score Display */}
          {currentStep === 5 && rating && (
            <div className="step-container">
              <div className="score-card">
                <div className="score-ring-container">
                  <svg
                    className="score-ring"
                    viewBox="0 0 120 120"
                  >
                    <circle
                      className="score-ring-bg"
                      cx="60"
                      cy="60"
                      r="54"
                      fill="none"
                      strokeWidth="8"
                    />
                    <circle
                      className="score-ring-fill"
                      cx="60"
                      cy="60"
                      r="54"
                      fill="none"
                      strokeWidth="8"
                      strokeDasharray={`${(rating.score / 100) * 339.3} 339.3`}
                      strokeDashoffset="0"
                      style={{
                        stroke: getScoreColor(rating.score),
                      }}
                    />
                  </svg>
                  <div className="score-number">{rating.score}</div>
                </div>

                <h2 className="score-label">{rating.label}</h2>
                <p className="score-description">{rating.description}</p>

                <div className="strengths">
                  {rating.strengths.map((strength, index) => (
                    <span key={index} className="strength-tag">
                      {strength}
                    </span>
                  ))}
                </div>

                <div className="concept-chip">{concept}</div>

                <button
                  className="new-session-btn"
                  onClick={() => {
                    setConcept("");
                    setSessionId(null);
                    setMessages([]);
                    setPassed([]);
                    setQuestionCount(0);
                    setFinalExplanation("");
                    setRating(null);
                    goToStep(1);
                  }}
                >
                  New concept
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-nav">
        <button
          className={`nav-item ${currentStep === 1 ? "active" : ""}`}
          onClick={() => goToStep(1)}
        >
          <span className="material-symbols-outlined">auto_stories</span>
          <span>Learn</span>
        </button>
        <button className="nav-item">
          <span className="material-symbols-outlined">history_edu</span>
          <span>Review</span>
        </button>
        <button className="nav-item">
          <span className="material-symbols-outlined">incomplete_circle</span>
          <span>Progress</span>
        </button>
        <button className="nav-item">
          <span className="material-symbols-outlined">settings</span>
          <span>Settings</span>
        </button>
      </nav>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="modal-overlay" onClick={() => setShowUpgradeModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">You&apos;ve used all 3 free sessions</h2>
            <p className="modal-subtitle">
              Upgrade to continue learning without limits
            </p>
            <div className="modal-plans">
              <div className="plan-card">
                <div className="plan-name">Free</div>
                <div className="plan-price">$0</div>
                <div className="plan-limit">3 sessions/day</div>
              </div>
              <div className="plan-card pro">
                <div className="plan-badge">RECOMMENDED</div>
                <div className="plan-name">Pro</div>
                <div className="plan-price">$9</div>
                <div className="plan-period">per month</div>
                <ul className="plan-features">
                  <li>Unlimited sessions</li>
                  <li>Past sessions history</li>
                  <li>Priority support</li>
                </ul>
                <button
                  className="plan-btn"
                  onClick={() => {
                    setShowUpgradeModal(false);
                    // TODO: Stripe checkout
                  }}
                >
                  Upgrade
                </button>
              </div>
            </div>
            <button
              className="modal-close"
              onClick={() => setShowUpgradeModal(false)}
            >
              Maybe later
            </button>
          </div>
        </div>
      )}

      {/* Decorative Background */}
      <div className="decor-bg">
        <div className="decor-blob1" />
        <div className="decor-blob2" />
      </div>
    </>
  );
}

export default function FeynmanPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-primary font-serif text-xl">Loading...</div>
      </div>
    }>
      <FeynmanContent />
    </Suspense>
  );
}