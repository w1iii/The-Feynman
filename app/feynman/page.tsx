import "./page.css";

export default function FeynmanPage() {
  return (
    <>
      {/* ═══════════════════════════════════════
           STEP 1 — CHOOSE CONCEPT
      ═════════════════════════════════════════ */}
      <section className="screen" id="s1">

        <a href="#s1" className="logo">
          <span className="logo-the">The</span>
          <span className="logo-script">Feynman</span>
        </a>

        <div className="dots">
          <span className="dot active"></span>
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>

        <div className="body">
          <div className="hint-row">
            <p className="hint">
              Pick any concept — a physics principle, a historical event,
              a business idea, a coding pattern. The Feynman technique works on anything.
            </p>
          </div>

          <div className="text-container">
          <input
            className="ghost-input"
            type="text"
            id="concept-input"
            placeholder="Enter a concept…"
            autoComplete="off"
            maxLength={4000}
          />
          </div>
        </div>

        <div className="bottom-bar">
          <span className="char-count">0 / 4000</span>
          <a className="btn" href="#s2">Submit</a>
        </div>

      </section>


      {/* ═══════════════════════════════════════
           STEP 2 — STUDY REMINDER
      ═════════════════════════════════════════ */}
      <section className="screen" id="s2">

        <a href="#s1" className="logo">
          <span className="logo-the">The</span>
          <span className="logo-script">Feynman</span>
        </a>

        <div className="dots">
          <span className="dot done"></span>
          <span className="dot active"></span>
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>

        <div className="body">
          <p className="study-eyebrow">Your concept</p>
          <div className="study-concept">Photosynthesis</div>
          <p className="study-body">
            Take a moment to recall what you know.<br />
            Close your notes. You will explain this from memory —<br />
            in your own words, as if teaching someone new.
          </p>
          <a className="btn" href="#s3" style={{ width: 'fit-content' }}>I&apos;m ready →</a>
        </div>

        <div className="bottom-left">
          <a className="btn-ghost" href="#s1">← Change concept</a>
        </div>

      </section>


      {/* ═══════════════════════════════════════
           STEP 3 — COACHING LOOP
      ═════════════════════════════════════════ */}
      <section className="screen" id="s3">

        <a href="#s1" className="logo">
          <span className="logo-the">The</span>
          <span className="logo-script">Feynman</span>
        </a>

        <div className="dots">
          <span className="dot done"></span>
          <span className="dot done"></span>
          <span className="dot active"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>

        <div className="body" style={{ overflow: 'hidden', gap: '16px' }}>

          <div className="chat-area">

            {/* AI opening message */}
            <div className="msg-ai">
              <div className="cursor"></div>
              <p className="msg-ai-text">
                Great — explain Photosynthesis as if you&apos;re teaching a curious
                12-year-old who has never heard of it. Close your notes. Your own words only.
              </p>
            </div>

            {/* User first answer */}
            <p className="msg-user">
              Photosynthesis is basically how plants make their food using sunlight.
              They take in air and water and turn it into energy somehow.
            </p>

            {/* AI follow-up */}
            <div className="msg-ai">
              <div className="cursor"></div>
              <p className="msg-ai-text">
                Good start — you&apos;ve got the broad idea. You mentioned plants &quot;turn it into
                energy somehow&quot; — can you walk me through what exactly is happening at that
                point? What goes in, what comes out, and why?
              </p>
            </div>

            {/* Criteria pills after turn 1 */}
            <div className="pills">
              <span className="pill pass">Plain language</span>
              <span className="pill pend">Core mechanism</span>
              <span className="pill pend">Analogy or example</span>
              <span className="pill pend">No gaps or filler</span>
              <span className="pill pend">Child-friendly</span>
            </div>

            {/* User second answer */}
            <p className="msg-user">
              Right — so the plant takes CO₂ from the air and water from the soil.
              Sunlight hits the green parts of the leaf, which have chlorophyll, and that
              energy is used to split the water apart. The hydrogen from the water combines
              with the CO₂ to build glucose — that is the food. The leftover oxygen from
              the water gets released into the air, which is what we breathe.
            </p>

            {/* Loading indicator */}
            <div className="loading-dots">
              <span></span><span></span><span></span>
            </div>

          </div>

          {/* Input area */}
          <textarea
            className="ghost-input"
            rows={3}
            placeholder="Write your explanation…"
            maxLength={4000}
          ></textarea>

        </div>

        <div className="bottom-bar">
          <span className="char-count">0 / 4000</span>
          <a className="btn" href="#s3">Submit</a>
        </div>

      </section>


      {/* ═══════════════════════════════════════
           STEP 4 — SUMMARY + FINAL EXPLANATION
      ═════════════════════════════════════════ */}
      <section className="screen" id="s4">

        <a href="#s1" className="logo">
          <span className="logo-the">The</span>
          <span className="logo-script">Feynman</span>
        </a>

        <div className="dots">
          <span className="dot done"></span>
          <span className="dot done"></span>
          <span className="dot done"></span>
          <span className="dot active"></span>
          <span className="dot"></span>
        </div>

        <div className="s4-body">

          <div className="summary-title">Write your best.</div>

          {/* Criteria checklist */}
          <div className="crit-list">
            <div className="crit-row">
              <span className="crit-icon pass">✓</span>
              <div>
                <div className="crit-name">Plain language</div>
                <div className="crit-sub">No unexplained jargon throughout</div>
              </div>
            </div>
            <div className="crit-row">
              <span className="crit-icon pass">✓</span>
              <div>
                <div className="crit-name">Core mechanism</div>
                <div className="crit-sub">Inputs, outputs, and process explained step by step</div>
              </div>
            </div>
            <div className="crit-row">
              <span className="crit-icon fail">○</span>
              <div>
                <div className="crit-name">Analogy or example</div>
                <div className="crit-sub">Still missing — connect it to something familiar</div>
              </div>
            </div>
            <div className="crit-row">
              <span className="crit-icon pass">✓</span>
              <div>
                <div className="crit-name">No gaps or filler</div>
                <div className="crit-sub">Concrete and specific throughout</div>
              </div>
            </div>
            <div className="crit-row">
              <span className="crit-icon pass">✓</span>
              <div>
                <div className="crit-name">Child-friendly</div>
                <div className="crit-sub">A 12-year-old could follow this</div>
              </div>
            </div>
          </div>

          {/* Best moment */}
          <div className="best-moment">
            <div className="best-eyebrow">Your best moment</div>
            <div className="best-quote">
              &quot;The leftover oxygen from the water gets released into the air —
              that&apos;s what we breathe.&quot;
            </div>
          </div>

          {/* Gap box (shown when not all criteria met) */}
          <div className="gap-box">
            <div className="gap-eyebrow">Address in your final explanation</div>
            1. Add an analogy — connect the process to something a child could picture.
            A factory, a kitchen, a solar panel — anything that makes the mechanism click.
          </div>

          <hr className="divider" />

          <p className="final-label">Your final explanation</p>
          <textarea
            className="ghost-input"
            rows={6}
            placeholder="Put it all together — your clearest, most complete explanation…"
            maxLength={4000}
          ></textarea>

        </div>

        <div className="bottom-bar">
          <span className="char-count">0 / 4000</span>
          <a className="btn" href="#s5">Rate my understanding</a>
        </div>

        <div className="bottom-left">
          <a className="btn-ghost" href="#s3">← Review coaching</a>
        </div>

      </section>


      {/* ═══════════════════════════════════════
           STEP 5 — SCORE
      ═════════════════════════════════════════ */}
      <section className="screen" id="s5">

        <a href="#s1" className="logo">
          <span className="logo-the">The</span>
          <span className="logo-script">Feynman</span>
        </a>

        <div className="dots">
          <span className="dot done"></span>
          <span className="dot done"></span>
          <span className="dot done"></span>
          <span className="dot done"></span>
          <span className="dot active"></span>
        </div>

        <div className="body">

          <div className="score-num">88</div>
          <div className="score-label">Strong understanding</div>

          <p className="score-desc">
            Your explanation covered the inputs, outputs, and mechanism clearly.
            The solar-panel kitchen analogy made the concept stick. A minor gap
            was not mentioning the two-stage process inside the chloroplast —
            but overall this is a strong Feynman explanation.
          </p>

          <div className="strengths">
            <div className="strength">Strong analogy that maps directly to the concept</div>
            <div className="strength">Covers all key inputs and outputs accurately</div>
            <div className="strength">Child-friendly language throughout</div>
          </div>

        </div>

        <div className="bottom-bar">
          <a className="btn" href="#s1">New concept</a>
        </div>

        <div className="bottom-left">
          <a className="btn-ghost" href="#s4">← Review session</a>
        </div>

      </section>
    </>
  );
}
