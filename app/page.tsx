import Link from "next/link";
import "./page.css";

export default function LandingPage() {
  return (
    <>
      <div className="grain-overlay"></div>
      
      {/* NAVBAR */}
      <nav className="navbar">
        <Link href="/" className="navbar-logo">
          Feynman
        </Link>
        
        <div className="navbar-links">
          <Link href="#" className="navbar-link active">Approach</Link>
          <Link href="#" className="navbar-link">Library</Link>
          <Link href="#" className="navbar-link">Principles</Link>
        </div>
        
        <div className="navbar-actions">
          <Link href="/login" className="navbar-signin">Sign In</Link>
          <Link href="/signup" className="navbar-cta">Get Started</Link>
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
                <span>school</span>
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
                <span>lightbulb</span>
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
                <span>auto_stories</span>
              </div>
            </div>
          </div>
        </section>
        
        {/* DETAIL SECTION */}
        <section className="detail-section">
          <div className="detail-content">
            <div className="detail-quote-box">
              <span className="detail-quote-icon">history_edu</span>
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
          <Link href="#" className="footer-link">Methods</Link>
          <Link href="#" className="footer-link">Academic Integrity</Link>
          <Link href="#" className="footer-link">Privacy</Link>
          <Link href="/login" className="footer-link">Sign In</Link>
        </div>
      </footer>
    </>
  );
}