"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "./lib/supabase/client";

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push("/feynman");
      }
    });
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-20 px-gutter max-w-[1200px] mx-auto bg-background/95 backdrop-blur-md border-b border-outline-variant/20">
        <Link href="/" className="font-display text-[28px] text-primary no-underline">
          Feynman
        </Link>

        <button
          className="sm:hidden flex items-center justify-center bg-none border-none p-2 text-primary cursor-pointer"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {menuOpen ? (
              <>
                <path d="M18 6L6 18" />
                <path d="M6 6l12 12" />
              </>
            ) : (
              <>
                <path d="M3 12h18" />
                <path d="M3 6h18" />
                <path d="M3 18h18" />
              </>
            )}
          </svg>
        </button>

        <div className={`${menuOpen ? "flex" : "hidden"} sm:flex flex-col sm:flex-row absolute sm:static top-20 left-0 right-0 bg-background sm:bg-transparent border-b sm:border-0 border-outline-variant/20 sm:border-none p-4 sm:p-0 gap-4 sm:gap-6 items-center shadow-md sm:shadow-none`}>
          <Link
            href="/login"
            className="font-body text-[14px] text-on-surface-variant no-underline hover:text-primary transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="font-body text-[11px] tracking-[0.4em] uppercase bg-primary text-on-primary px-6 py-3 rounded-full no-underline hover:bg-[#0d3323] transition-all duration-300 submit-btn-shadow"
            onClick={() => setMenuOpen(false)}
          >
            Get Started
          </Link>
        </div>
      </nav>

      <main className="flex-1 pt-20">
        {/* Hero */}
        <section className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center text-center px-gutter py-16">
          <span className="font-body text-[11px] tracking-[0.4em] uppercase text-primary mb-6 opacity-80">
            For Filipino students and lifelong learners
          </span>
          <h1 className="font-display text-[clamp(44px,7vw,84px)] text-primary leading-[1.05] mb-6 max-w-[850px]">
            Master difficult lessons by explaining them.
          </h1>
          <p className="font-display text-[clamp(20px,3vw,32px)] text-on-surface-variant italic max-w-[500px] mb-12">
            Learn with an AI coach that helps you find the gaps.
          </p>

          <div className="flex gap-4 mb-12 flex-col sm:flex-row">
            <Link
              href="/signup"
              className="font-body text-[11px] tracking-[0.4em] uppercase bg-primary text-on-primary px-14 py-4 rounded-full no-underline hover:bg-[#0d3323] transition-all duration-300 submit-btn-shadow"
            >
              Start for free
            </Link>
            <Link
              href="/login"
              className="font-body text-[11px] tracking-[0.4em] uppercase bg-transparent text-primary px-14 py-4 rounded-full no-underline border border-primary/20 hover:bg-surface-container-lowest transition-all duration-300"
            >
              Sign In
            </Link>
          </div>
          <p className="font-body text-[12px] text-on-surface-variant/70 -mt-6 mb-10">
            No credit card required
          </p>

          <div aria-label="24-second product demo" className="relative w-full max-w-[900px] rounded-xl overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.1)] border border-outline-variant/20 bg-surface-container-lowest text-left">
            <div className="flex items-center justify-between border-b border-outline-variant/20 px-5 py-3">
              <span className="font-body text-[11px] tracking-[0.25em] uppercase text-primary">24-second demo</span>
              <span className="font-body text-[12px] text-on-surface-variant/60">Watch how it works</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-6 p-6 sm:p-10">
              <div className="rounded-lg bg-background p-5 border border-outline-variant/20">
                <span className="font-body text-[10px] tracking-[0.2em] uppercase text-on-surface-variant/60">You explain</span>
                <p className="font-display text-[22px] text-primary mt-3">Glycolysis turns glucose into energy...</p>
              </div>
              <span className="material-symbols-outlined text-primary text-3xl rotate-90 md:rotate-0" aria-hidden="true">arrow_forward</span>
              <div className="rounded-lg bg-primary p-5 text-on-primary">
                <span className="font-body text-[10px] tracking-[0.2em] uppercase text-on-primary/70">Your AI coach asks</span>
                <p className="font-display text-[22px] mt-3">What happens to the glucose molecule first?</p>
              </div>
            </div>
            <div className="h-1 bg-primary/10">
              <div className="h-full w-2/3 bg-primary animate-demo-progress" />
            </div>
          </div>
          <p className="font-body text-[12px] text-on-surface-variant/70 mt-5">
            Try it with glycolysis, derivatives, or Rizal.
          </p>
        </section>

        {/* Real examples */}
        <section className="py-16 px-gutter max-w-[1200px] mx-auto border-t border-outline-variant/20">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-10 items-start">
            <div>
              <span className="font-body text-[11px] tracking-[0.3em] uppercase text-primary">Start with any lesson</span>
              <h2 className="font-display text-[clamp(30px,4vw,48px)] text-primary leading-tight mt-3">Turn “I don&apos;t get it” into “I can explain it.”</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {["Explain glycolysis", "Explain derivatives", "Explain Rizal"].map((example) => (
                <div key={example} className="bg-surface-container-lowest rounded-xl p-6 border border-outline-variant/20 shadow-[0_2px_12px_rgba(20,66,45,0.08)]">
                  <span className="material-symbols-outlined text-primary mb-8" aria-hidden="true">edit_note</span>
                  <p className="font-display text-[21px] text-primary">{example}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 px-gutter max-w-[1200px] mx-auto border-t border-b border-outline-variant/20">
          <div className="text-center mb-12">
            <h2 className="font-display text-[clamp(24px,3vw,36px)] text-primary mb-2">
              How It Works
            </h2>
            <div className="w-16 h-[3px] bg-primary mx-auto" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { num: "01", title: "Choose a Concept", desc: "Pick any topic you want to understand — physics, history, coding, business — anything. Start with the curiosity that drives you." },
              { num: "02", title: "Explain Simply", desc: "Teach it in plain language as if explaining to a child. We'll guide you through the gaps, identifying where your explanation falters." },
              { num: "03", title: "Master It", desc: "Get feedback, fill in the blanks, and build true understanding that lasts. Refine your knowledge until the complex becomes intuitive." },
            ].map((step, i) => (
              <div
                key={i}
                className="bg-surface-container-lowest rounded-xl p-8 shadow-[0_2px_12px_rgba(20,66,45,0.1)] border border-outline-variant/10 transition-all duration-500 hover:-translate-y-1"
              >
                <span className="font-display text-[48px] text-primary/20 leading-none">{step.num}</span>
                <h3 className="font-display text-[22px] text-primary mt-2 mb-4">{step.title}</h3>
                <p className="font-body text-[15px] text-on-surface-variant leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Quote Section */}
        <section className="py-16 px-gutter max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="bg-primary/5 rounded-xl p-8 border border-primary/10 relative overflow-hidden">
            <svg className="absolute top-4 right-4 text-primary/10 w-20 h-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
              <path d="M5 20h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
            </svg>
            <h4 className="font-display text-[22px] italic text-primary mb-4">The Philosophy of Simplicity</h4>
            <p className="font-display text-[18px] italic text-on-background leading-relaxed mb-6">
              &ldquo;If you can&apos;t explain it simply, you don&apos;t understand it well enough.&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-px bg-primary/30" />
              <span className="font-body text-[11px] tracking-[0.3em] uppercase text-primary">Richard Feynman</span>
            </div>
          </div>

          <div className="relative w-full h-[300px] sm:h-[400px] rounded-xl overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.1)] border border-outline-variant/20">
            <Image src="/image.jpg" alt="Learning space" fill className="object-cover" sizes="(max-width: 640px) 100vw, 600px" />
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 px-gutter pb-16 max-w-[1200px] mx-auto w-full">
          <div className="relative bg-primary/5 rounded-2xl p-12 text-center overflow-hidden border border-primary/10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(20,66,45,0.08)_0%,transparent_70%)] opacity-50" />
            <div className="relative z-10">
              <h2 className="font-display text-[clamp(28px,4vw,40px)] text-primary mb-6">
                Ready to master your curiosity?
              </h2>
              <p className="font-body text-[16px] text-on-surface-variant max-w-[500px] mx-auto mb-8">
                Start with 3 free coaching sessions every day. Upgrade to Pro when you need unlimited practice.
              </p>
              <Link
                href="/signup"
                className="inline-block font-body text-[11px] tracking-[0.4em] uppercase bg-primary text-on-primary px-14 py-4 rounded-full no-underline hover:bg-[#0d3323] transition-all duration-300 submit-btn-shadow"
              >
                Start for free
              </Link>
            </div>
          </div>
        </section>

        {/* Philippine pricing */}
        <section className="py-16 px-gutter max-w-[1200px] mx-auto">
          <div className="rounded-2xl bg-primary text-on-primary p-8 sm:p-12 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-8 items-center">
            <div>
              <span className="font-body text-[11px] tracking-[0.3em] uppercase text-on-primary/70">Simple Philippine pricing</span>
              <h2 className="font-display text-[clamp(30px,4vw,44px)] mt-3">Keep learning at your pace.</h2>
              <p className="font-body text-[15px] text-on-primary/75 mt-4 max-w-[560px]">
                Free gives you 3 sessions per day. Pro is ₱499/month for unlimited sessions, payable with GCash, Maya, or card.
              </p>
            </div>
            <Link href="/signup" className="inline-block text-center font-body text-[11px] tracking-[0.3em] uppercase bg-on-primary text-primary px-8 py-4 rounded-full no-underline hover:bg-white/90 transition-all">
              Try it free
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="flex flex-col sm:flex-row justify-between items-center gap-6 px-gutter py-12 max-w-[1200px] mx-auto w-full border-t border-outline-variant/20">
        <span className="font-display text-[14px] italic text-outline">
          &copy; {new Date().getFullYear()} Feynman Learning. Built for the intellectually curious.
        </span>
        <div className="flex gap-6">
          <Link href="/login" className="font-display text-[14px] italic text-outline no-underline hover:text-primary transition-colors border-b border-transparent hover:border-primary">
            Sign In
          </Link>
        </div>
      </footer>
    </div>
  );
}
