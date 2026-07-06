"use client";

import { FormEvent, useState } from "react";
import { createClient } from "../lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/feynman");
    }
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
