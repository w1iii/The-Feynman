"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
      router.push("/feynman");
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-20 px-gutter max-w-[1200px] mx-auto bg-background/95 backdrop-blur-md border-b border-outline-variant/20">
          <Link href="/" className="font-display text-[28px] text-primary no-underline">
            Feynman
          </Link>
          <Link href="/" className="font-body text-[14px] text-on-surface-variant no-underline hover:text-primary transition-colors">
            Home
          </Link>
        </nav>
        <main className="flex-1 flex items-center justify-center pt-20 px-gutter">
          <div className="text-center">
            <h1 className="font-display text-[28px] text-primary mb-4">Check your email</h1>
            <p className="font-body text-[15px] text-on-surface-variant">
              We sent a confirmation link to {email}.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-20 px-gutter max-w-[1200px] mx-auto bg-background/95 backdrop-blur-md border-b border-outline-variant/20">
        <Link href="/" className="font-display text-[28px] text-primary no-underline">
          Feynman
        </Link>
        <Link href="/" className="font-body text-[14px] text-on-surface-variant no-underline hover:text-primary transition-colors">
          Home
        </Link>
      </nav>

      <main className="flex-1 flex items-center justify-center pt-20 px-gutter">
        <div className="w-full max-w-[400px] bg-surface-container-lowest rounded-xl p-8 shadow-[0_2px_12px_rgba(20,66,45,0.1)] border border-outline-variant/10">
          <h1 className="font-display text-[28px] text-primary text-center mb-2">Create account</h1>
          <p className="font-body text-[14px] text-on-surface-variant text-center mb-8">Start learning deeply</p>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 mb-5 bg-error-container text-error font-body text-[13px] rounded-lg">
                {error}
              </div>
            )}

            <div className="mb-5">
              <label htmlFor="email" className="block font-body text-[11px] tracking-[0.15em] uppercase text-on-surface-variant mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="w-full px-4 py-3 font-body text-[15px] text-on-background bg-background border border-outline-variant/30 rounded-lg outline-none transition-all duration-200 focus:border-primary focus:bg-surface-container-lowest"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mb-6">
              <label htmlFor="password" className="block font-body text-[11px] tracking-[0.15em] uppercase text-on-surface-variant mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="w-full px-4 py-3 font-body text-[15px] text-on-background bg-background border border-outline-variant/30 rounded-lg outline-none transition-all duration-200 focus:border-primary focus:bg-surface-container-lowest"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full font-body text-[11px] tracking-[0.4em] uppercase bg-primary text-on-primary px-14 py-4 rounded-full hover:bg-[#0d3323] transition-all duration-300 submit-btn-shadow disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-primary"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center font-body text-[13px] text-on-surface-variant">
            Already have an account?{" "}
            <Link href="/login" className="text-primary no-underline border-b border-primary/30 hover:border-primary transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
