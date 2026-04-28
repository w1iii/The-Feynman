"use client";

import { useState, useEffect } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Session = {
  id: string;
  concept: string;
  status: string;
};

export default function TestPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<string>("");
  const [concept, setConcept] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newSessionId, setNewSessionId] = useState<string | null>(null);

  // Fetch sessions on load
  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/getsession");
      const data = await res.json();
      if (data.sessions) {
        setSessions(data.sessions);
        if (data.sessions.length > 0) {
          setSelectedSession(data.sessions[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    }
  };

  const createSession = async () => {
    if (!concept.trim()) {
      setError("Please enter a concept");
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
        setNewSessionId(data.id);
        setSelectedSession(data.id);
        setMessages([]);
        setConcept("");
        fetchSessions();
      } else {
        setError(data.error || "Failed to create session");
      }
    } catch (err) {
      setError("Failed to create session");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !selectedSession) return;

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
          concept: sessions.find((s) => s.id === selectedSession)?.concept || "",
          session_id: selectedSession,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        if (data.question) {
          const assistantMessage: Message = { role: "assistant", content: data.question };
          setMessages([...newMessages, assistantMessage]);
        }
        if (data.done) {
          alert("Session complete! Messages saved to database.");
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

  return (
    <div className="container">
      <h1 className="title">Coach Test Page</h1>

      <div className="section">
        <h2 className="section-title">Create New Session</h2>
        <div className="input-row">
          <input
            type="text"
            className="input"
            placeholder="Enter a concept to explain..."
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
          />
          <button
            className="button"
            onClick={createSession}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Session"}
          </button>
        </div>
      </div>

      <div className="section">
        <h2 className="section-title">Select Session</h2>
        <select
          className="select"
          value={selectedSession}
          onChange={(e) => setSelectedSession(e.target.value)}
        >
          <option value="">Select a session...</option>
          {sessions.map((session) => (
            <option key={session.id} value={session.id}>
              {session.concept} ({session.status})
            </option>
          ))}
        </select>
      </div>

      {selectedSession && (
        <div className="section">
          <h2 className="section-title">Chat</h2>
          <div className="chat-box">
            {messages.length === 0 ? (
              <p className="empty-text">Start explaining your concept...</p>
            ) : (
              messages.map((msg, index) => (
                <div
                  key={index}
                  className={`message ${msg.role}`}
                >
                  <span className="message-label">{msg.role === "user" ? "You" : "Coach"}:</span>
                  {msg.content}
                </div>
              ))
            )}
          </div>

          <div className="input-row">
            <input
              type="text"
              className="input"
              placeholder="Type your explanation..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              disabled={loading}
            />
            <button
              className="button"
              onClick={sendMessage}
              disabled={loading}
            >
              {loading ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      )}

      {error && <p className="error">{error}</p>}

      <style jsx>{`
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .title {
          font-size: 28px;
          color: #2d6a4f;
          margin-bottom: 24px;
          text-align: center;
        }

        .section {
          margin-bottom: 24px;
          padding: 16px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: #fafafa;
        }

        .section-title {
          font-size: 16px;
          color: #333;
          margin-bottom: 12px;
        }

        .input-row {
          display: flex;
          gap: 8px;
        }

        .input {
          flex: 1;
          padding: 10px 12px;
          font-size: 14px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }

        .input:focus {
          outline: none;
          border-color: #2d6a4f;
        }

        .select {
          width: 100%;
          padding: 10px 12px;
          font-size: 14px;
          border: 1px solid #ccc;
          border-radius: 4px;
          background: white;
        }

        .button {
          padding: 10px 20px;
          font-size: 14px;
          background: #2d6a4f;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .button:hover {
          background: #1b4332;
        }

        .button:disabled {
          background: #999;
          cursor: not-allowed;
        }

        .chat-box {
          min-height: 200px;
          max-height: 400px;
          overflow-y: auto;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 12px;
          background: white;
          margin-bottom: 12px;
        }

        .empty-text {
          color: #999;
          text-align: center;
          padding: 40px;
        }

        .message {
          padding: 8px 12px;
          margin-bottom: 8px;
          border-radius: 4px;
        }

        .message.user {
          background: #e8f5e9;
          text-align: right;
        }

        .message.assistant {
          background: #f5f5f5;
        }

        .message-label {
          font-weight: bold;
          font-size: 12px;
          color: #666;
          display: block;
          margin-bottom: 4px;
        }

        .error {
          color: #d32f2f;
          padding: 12px;
          background: #ffebee;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}