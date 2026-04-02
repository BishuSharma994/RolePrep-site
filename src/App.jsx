import { useState } from "react";

const TELEGRAM_START_URL = "https://t.me/Roleprep_bot?start=web";
const TELEGRAM_PRICING_URL = "https://t.me/Roleprep_bot?start=pricing";
const DEMO_QUESTION = "Tell me about a challenging bug you fixed.";

export default function App() {
  const [role, setRole] = useState("");
  const [demoStarted, setDemoStarted] = useState(false);

  const handleDemoStart = () => {
    setDemoStarted(true);
  };

  return (
    <>
      <style>{`
        :root {
          color: #152033;
          background: #f4f7fb;
          font-family: Arial, Helvetica, sans-serif;
          line-height: 1.5;
          font-weight: 400;
        }

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          min-width: 320px;
          background:
            radial-gradient(circle at top left, rgba(47, 109, 245, 0.12), transparent 34%),
            linear-gradient(180deg, #f8fbff 0%, #eef3f9 100%);
          color: #152033;
        }

        a {
          color: inherit;
          text-decoration: none;
        }

        button,
        input {
          font: inherit;
        }

        .page {
          min-height: 100vh;
        }

        .container {
          width: min(1120px, calc(100% - 32px));
          margin: 0 auto;
        }

        .section {
          padding: 32px 0;
        }

        .hero {
          padding: 72px 0 40px;
        }

        .hero-card,
        .card {
          background: rgba(255, 255, 255, 0.84);
          border: 1px solid rgba(21, 32, 51, 0.08);
          border-radius: 24px;
          box-shadow: 0 20px 50px rgba(21, 32, 51, 0.08);
          backdrop-filter: blur(10px);
        }

        .hero-card {
          padding: 56px;
          display: grid;
          grid-template-columns: 1.3fr 0.9fr;
          gap: 32px;
          align-items: center;
        }

        .eyebrow {
          display: inline-flex;
          padding: 8px 14px;
          border-radius: 999px;
          background: #e7efff;
          color: #2956c8;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.02em;
          margin-bottom: 18px;
        }

        h1,
        h2,
        h3,
        p {
          margin: 0;
        }

        h1 {
          font-size: clamp(2.3rem, 4vw, 4.5rem);
          line-height: 1.05;
          letter-spacing: -0.04em;
          max-width: 12ch;
        }

        .subtitle {
          margin-top: 18px;
          max-width: 52ch;
          font-size: 1.06rem;
          color: #4a5a72;
        }

        .primary-button,
        .secondary-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 48px;
          padding: 0 20px;
          border-radius: 14px;
          border: none;
          cursor: pointer;
          transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
        }

        .primary-button {
          background: #1f5eff;
          color: #ffffff;
          font-weight: 700;
          box-shadow: 0 12px 24px rgba(31, 94, 255, 0.24);
        }

        .primary-button:hover,
        .secondary-button:hover {
          transform: translateY(-1px);
        }

        .secondary-button {
          background: #152033;
          color: #ffffff;
          font-weight: 700;
        }

        .hero-actions {
          margin-top: 28px;
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
        }

        .hero-panel {
          padding: 28px;
          border-radius: 22px;
          background: linear-gradient(180deg, #18356f 0%, #0f1d3a 100%);
          color: #ffffff;
          min-height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 18px;
        }

        .panel-label {
          font-size: 0.84rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: rgba(255, 255, 255, 0.72);
        }

        .panel-question {
          padding: 18px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.08);
          font-size: 1rem;
        }

        .panel-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .panel-pill {
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.84);
          font-size: 0.92rem;
        }

        .section-heading {
          margin-bottom: 20px;
          font-size: clamp(1.65rem, 2vw, 2.2rem);
          letter-spacing: -0.03em;
        }

        .section-copy {
          margin-bottom: 24px;
          color: #55647c;
          max-width: 58ch;
        }

        .card {
          padding: 28px;
        }

        .demo-controls {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .demo-input {
          flex: 1 1 320px;
          min-height: 48px;
          border-radius: 14px;
          border: 1px solid #c9d3e1;
          background: #ffffff;
          padding: 0 16px;
          color: #152033;
        }

        .demo-input:focus {
          outline: 2px solid #9db8ff;
          outline-offset: 1px;
          border-color: #7fa3ff;
        }

        .demo-output {
          margin-top: 18px;
          padding: 18px;
          border-radius: 18px;
          background: #edf3ff;
          border: 1px solid #d7e4ff;
        }

        .demo-role {
          margin-bottom: 8px;
          font-size: 0.92rem;
          color: #476096;
          font-weight: 700;
        }

        .steps-grid,
        .trust-grid,
        .pricing-grid {
          display: grid;
          gap: 18px;
        }

        .steps-grid {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }

        .trust-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .pricing-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
          margin-bottom: 20px;
        }

        .step-number {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #1f5eff;
          color: #ffffff;
          font-weight: 700;
          margin-bottom: 18px;
        }

        .card-title {
          margin-bottom: 10px;
          font-size: 1.08rem;
        }

        .card-copy {
          color: #5b6b83;
        }

        .price {
          margin-bottom: 8px;
          font-size: 2rem;
          font-weight: 700;
          letter-spacing: -0.03em;
        }

        .price-note {
          color: #56657d;
        }

        .pricing-footer {
          display: flex;
          justify-content: flex-start;
        }

        .trust-item {
          position: relative;
          padding-left: 18px;
        }

        .trust-item::before {
          content: "";
          position: absolute;
          top: 10px;
          left: 0;
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: #1f5eff;
        }

        .footer {
          padding: 10px 0 48px;
          color: #68778e;
          text-align: center;
          font-size: 0.95rem;
        }

        @media (max-width: 900px) {
          .hero-card {
            grid-template-columns: 1fr;
            padding: 32px 24px;
          }

          .steps-grid,
          .trust-grid,
          .pricing-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 600px) {
          .hero {
            padding-top: 40px;
          }

          .section {
            padding: 24px 0;
          }

          .card {
            padding: 22px;
          }

          .hero-actions,
          .demo-controls,
          .pricing-footer {
            display: flex;
            flex-direction: column;
          }

          .primary-button,
          .secondary-button,
          .demo-input {
            width: 100%;
          }
        }
      `}</style>

      <main className="page">
        <section className="hero">
          <div className="container">
            <div className="hero-card">
              <div>
                <span className="eyebrow">RolePrep</span>
                <h1>Practice real interview questions in 5 minutes</h1>
                <p className="subtitle">
                  Get instant interview practice before your next interview
                </p>
                <div className="hero-actions">
                  <a
                    className="primary-button"
                    href={TELEGRAM_START_URL}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Start on Telegram
                  </a>
                </div>
              </div>

              <div className="hero-panel">
                <div className="panel-label">Sample Interview Flow</div>
                <div className="panel-question">
                  Start a role-based practice round and get realistic questions in seconds.
                </div>
                <div className="panel-meta">
                  <span className="panel-pill">Telegram-first</span>
                  <span className="panel-pill">Quick sessions</span>
                  <span className="panel-pill">Interview-style prompts</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="card">
              <h2 className="section-heading">Try a quick demo</h2>
              <p className="section-copy">
                Enter a role and reveal a sample interview question. This is a static preview with no signup and no backend.
              </p>
              <div className="demo-controls">
                <input
                  className="demo-input"
                  type="text"
                  placeholder="Enter role (e.g. Backend Developer)"
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                />
                <button className="secondary-button" type="button" onClick={handleDemoStart}>
                  Start Demo
                </button>
              </div>

              {demoStarted && (
                <div className="demo-output">
                  <div className="demo-role">
                    Demo role: {role.trim() || "Backend Developer"}
                  </div>
                  <p>{DEMO_QUESTION}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <h2 className="section-heading">How it works</h2>
            <div className="steps-grid">
              <div className="card">
                <div className="step-number">1</div>
                <h3 className="card-title">Open Telegram bot</h3>
                <p className="card-copy">Launch RolePrep directly in Telegram and begin in seconds.</p>
              </div>
              <div className="card">
                <div className="step-number">2</div>
                <h3 className="card-title">Choose your role</h3>
                <p className="card-copy">Pick the job profile you want to practice for before the interview.</p>
              </div>
              <div className="card">
                <div className="step-number">3</div>
                <h3 className="card-title">Start interview</h3>
                <p className="card-copy">Begin a short session and answer realistic interview prompts.</p>
              </div>
              <div className="card">
                <div className="step-number">4</div>
                <h3 className="card-title">Get instant questions</h3>
                <p className="card-copy">Practice quickly whenever you need a focused interview warm-up.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="card">
              <h2 className="section-heading">Pricing</h2>
              <div className="pricing-grid">
                <div className="card">
                  <div className="price">&#8377;10</div>
                  <p className="price-note">1 session</p>
                </div>
                <div className="card">
                  <div className="price">&#8377;29</div>
                  <p className="price-note">5 sessions</p>
                </div>
                <div className="card">
                  <div className="price">&#8377;99</div>
                  <p className="price-note">28 days unlimited</p>
                </div>
              </div>
              <div className="pricing-footer">
                <a
                  className="primary-button"
                  href={TELEGRAM_PRICING_URL}
                  target="_blank"
                  rel="noreferrer"
                >
                  Get Started
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="card">
              <h2 className="section-heading">Why RolePrep</h2>
              <div className="trust-grid">
                <div className="trust-item">
                  <h3 className="card-title">Real interview-style questions</h3>
                  <p className="card-copy">Practice with prompts designed to feel like live screening and interview rounds.</p>
                </div>
                <div className="trust-item">
                  <h3 className="card-title">Role-specific preparation</h3>
                  <p className="card-copy">Focus your session around the role you are interviewing for instead of generic practice.</p>
                </div>
                <div className="trust-item">
                  <h3 className="card-title">Fast and simple practice</h3>
                  <p className="card-copy">Open Telegram, start a session, and prepare in a few minutes before your next interview.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="footer">
          <div className="container">RolePrep helps candidates practice short, role-based interview sessions on Telegram.</div>
        </footer>
      </main>
    </>
  );
}
