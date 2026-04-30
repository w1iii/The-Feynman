"use client";

import Link from "next/link";
import { useState } from "react";
import "./page.css";

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <div className="grain-overlay"></div>
      
      {/* NAVBAR */}
      <nav className="navbar">
        <Link href="/" className="navbar-logo">
          Feynman
        </Link>
        
        {/* Hamburger (mobile) */}
        <button className="navbar-hamburger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
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

        <div className={`navbar-actions ${menuOpen ? "navbar-actions--open" : ""}`}>
          <Link href="/login" className="navbar-signin" onClick={() => setMenuOpen(false)}>Sign In</Link>
          <Link href="/signup" className="navbar-cta" onClick={() => setMenuOpen(false)}>Get Started</Link>
        </div>
      </nav>
      
      {/* MAIN */}
      <main>
        {/* HERO SECTION */}
        <section className="soft-gradient-bg hero">
          <span className="hero-eyebrow">The Master&apos;s Method</span>
          <h1 className="hero-title">Feynman</h1>
          <p className="hero-subtitle">Learn anything deeply</p>
          
          <div className="hero-actions">
            <Link href="/signup" className="hero-primary">Get Started</Link>
            <Link href="/login" className="hero-secondary">Sign In</Link>
          </div>
          
          <div className="hero-image">
            <img 
              src="/image.jpg" 
              alt="Feynman learning" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </section>
        
        {/* HOW IT WORKS */}
        <section className="how-it-works">
          <div className="section-header">
            <h2 className="section-title">How It Works</h2>
            <div className="section-line"></div>
          </div>
          
          <div className="steps-grid">
            {/* Step 1 */}
            <div className="step-card">
              <div className="step-number">1</div>
              <h3 className="step-title">Choose a Concept</h3>
              <p className="step-desc">
                Pick any topic you want to understand — physics, history, coding, business — anything. Start with the curiosity that drives you.
              </p>
              <div className="step-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
              </div>
            </div>
            
            {/* Step 2 */}
            <div className="step-card">
              <div className="step-number">2</div>
              <h3 className="step-title">Explain Simply</h3>
              <p className="step-desc">
                Teach it in plain language as if explaining to a child. We&apos;ll guide you through the gaps, identifying where your explanation falters.
              </p>
              <div className="step-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18h6"/>
                  <path d="M10 22h4"/>
                  <path d="M12 2v1"/>
                  <path d="M12 8v4"/>
                  <path d="M12 16h.01"/>
                  <path d="M8 12h.01"/>
                  <path d="M16 12h.01"/>
                  <path d="M12 14c1.5 0 3-1 3-2.5S14 9 12 9s-3 1-3 2.5S10.5 14 12 14z"/>
                </svg>
              </div>
            </div>
            
            {/* Step 3 */}
            <div className="step-card">
              <div className="step-number">3</div>
              <h3 className="step-title">Master It</h3>
              <p className="step-desc">
                Get feedback, fill in the blanks, and build true understanding that lasts. Refine your knowledge until the complex becomes intuitive.
              </p>
              <div className="step-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
                  <path d="M8 7h6"/>
                  <path d="M8 11h8"/>
                </svg>
              </div>
            </div>
          </div>
        </section>
        
        {/* DETAIL SECTION */}
        <section className="detail-section">
          <div className="detail-content">
            <div className="detail-quote-box">
              <svg className="detail-quote-icon" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
                <path d="M5 20h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"/>
              </svg>
              <h4 className="detail-quote-title">The Philosophy of Simplicity</h4>
              <p className="detail-quote-text">
                &ldquo;If you can&apos;t explain it simply, you don&apos;t understand it well enough.&rdquo;
              </p>
              <div className="detail-quote-author">
                <div className="detail-quote-line"></div>
                <span>Richard Feynman</span>
              </div>
            </div>
          </div>
          
          <div className="detail-image">
            <img 
              src="/image.jpg" 
              alt="Learning space" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        </section>
        
        {/* CTA SECTION */}
        <section className="cta-section">
          <div className="cta-box">
            <div className="cta-gradient"></div>
            <h2 className="cta-title">Ready to master your curiosity?</h2>
            <p className="cta-text">
              Join thousands of researchers, students, and lifelong learners who use the Feynman technique to build lasting knowledge.
            </p>
            <Link href="/signup" className="cta-button">Get Started Now</Link>
          </div>
        </section>
      </main>
      
      {/* FOOTER */}
      <footer>
        <span className="footer-copy">
          &copy; 2024 Feynman Learning. Built for the intellectually curious.
        </span>
        <div className="footer-links">
          <Link href="/login" className="footer-link">Sign In</Link>
        </div>
      </footer>
    </>
  );
}
