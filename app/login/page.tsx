"use client";

import { FormEvent, useState } from "react";
import { createClient } from "../lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "Unable to sign in");
      setLoading(false);
    } else {
      router.push("/feynman");
    }
  }

  async function handleGoogleLogin() {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });
    if (error) setError(error.message);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-20 px-gutter max-w-[1200px] mx-auto bg-background/95 backdrop-blur-md border-b border-outline-variant/20">
        <Link href="/" className="font-display text-[28px] text-primary no-underline">
          <Image src="/f-logo.png" alt="The Feynman" width={38} height={38} className="object-contain" priority />
        </Link>
        <Link href="/" className="font-body text-[14px] text-on-surface-variant no-underline hover:text-primary transition-colors">
          Home
        </Link>
      </nav>

      <main className="flex-1 flex items-center justify-center pt-20 px-gutter">
        <div className="w-full max-w-[400px] bg-surface-container-lowest rounded-xl p-8 shadow-[0_2px_12px_rgba(20,66,45,0.1)] border border-outline-variant/10">
          <h1 className="font-display text-[28px] text-primary text-center mb-2">Sign In</h1>
          <p className="font-body text-[14px] text-on-surface-variant text-center mb-8">Welcome back</p>

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
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full font-body text-[11px] tracking-[0.4em] uppercase bg-primary text-on-primary px-14 py-4 rounded-full hover:bg-[#0d3323] transition-all duration-300 submit-btn-shadow disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-primary"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline-variant/20" />
            </div>
            <div className="relative flex justify-center text-[11px]">
              <span className="bg-surface-container-lowest px-3 font-body text-on-surface-variant/40 uppercase tracking-wider">or</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 font-body text-[13px] text-on-background bg-background border border-outline-variant/30 px-4 py-3 rounded-lg hover:bg-surface-container-lowest transition-all duration-200"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <p className="mt-6 text-center font-body text-[13px] text-on-surface-variant">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-primary no-underline border-b border-primary/30 hover:border-primary transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
