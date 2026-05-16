"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import "./page.css";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        redirectTo: `${window.location.origin}/api/auth/callback`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error);
      setLoading(false);
    } else if (data.autoConfirmed) {
      // User is signed in immediately (email confirmation is disabled)
      router.push("/feynman");
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <>
        <nav className="navbar">
          <Link href="/" className="navbar-logo">
            Feynman
          </Link>
          
          <div className="navbar-actions">
            <Link href="/" className="navbar-home">Home</Link>
          </div>
        </nav>
        
        <div className="success-container">
          <div className="success-box">
            <h1 className="success-title">Check your email</h1>
            <p className="success-text">
              We sent a confirmation link to {email}.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <nav className="navbar">
        <Link href="/" className="navbar-logo">
          Feynman
        </Link>
        
        <div className="navbar-actions">
          <Link href="/" className="navbar-home">Home</Link>
        </div>
      </nav>
      
      <div className="signup-container">
        <div className="signup-box">
          <h1 className="signup-title">Create account</h1>
          <p className="signup-subtitle">Start learning deeply</p>

          <form onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            <button type="submit" className="form-button" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="form-footer">
            Already have an account? <Link href="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </>
  );
}