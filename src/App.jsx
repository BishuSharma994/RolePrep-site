import { useEffect, useState } from "react";

const TELEGRAM_BOT = "https://t.me/Roleprep_bot";
const TELEGRAM_WEB_BOT = "https://web.telegram.org/k/#@Roleprep_bot";

const QUESTION_BANK = {
  backend: [
    "Describe a time you had to optimize a slow database query. What was the problem and how did you fix it?",
    "How would you design a rate-limiting system for a high-traffic REST API?",
    "Walk me through how you would debug an intermittent 500 error in production.",
  ],
  frontend: [
    "How have you handled performance issues in a large React or JavaScript application?",
    "Describe your approach to making a web app fully accessible.",
    "Walk me through how you would debug a layout issue across multiple browsers.",
  ],
  product: [
    "Tell me about a feature you shipped that didn't perform as expected. What did you learn?",
    "How do you prioritize between competing feature requests from different stakeholders?",
    "How do you decide when a product is ready to ship vs. needs more work?",
  ],
  data: [
    "Walk me through a data analysis where your findings were surprising or counterintuitive.",
    "How would you handle missing or inconsistent data in a large dataset?",
    "How do you decide which metrics actually matter for a business problem?",
  ],
  design: [
    "Walk me through your design process for a feature from brief to final delivery.",
    "How do you balance user needs with technical or business constraints?",
    "How do you validate that a design actually solves the user's problem?",
  ],
  general: [
    "Tell me about a time you had to solve a problem with incomplete information.",
    "Describe a project where you had to learn something new quickly. What was your approach?",
    "Tell me about a time you failed. What did you take away from it?",
  ],
};

const PLANS = [
  { id: "starter", price: "Rs 10", name: "Starter", desc: "1 session", detail: "Quick practice before a specific interview.", featured: false },
  { id: "pack", price: "Rs 29", name: "Pack", desc: "5 sessions", detail: "Best for focused prep over a week.", featured: true },
  { id: "unlimited", price: "Rs 99", name: "Unlimited", desc: "28 days", detail: "Full access for active job seekers.", featured: false },
];

const ROLE_SUGGESTIONS = [
  "Backend Developer",
  "Frontend Developer",
  "Product Manager",
  "Data Analyst",
  "UX Designer",
  "Full Stack Developer",
  "Data Scientist",
  "DevOps Engineer",
];

function getCategory(role) {
  const r = role.toLowerCase();
  if (r.includes("backend") || r.includes("node") || r.includes("python") || r.includes("java") || r.includes("server") || r.includes("devops") || r.includes("cloud")) return "backend";
  if (r.includes("frontend") || r.includes("react") || r.includes("vue") || r.includes("angular") || r.includes("ui developer") || r.includes("web dev")) return "frontend";
  if (r.includes("product") || r.includes("manager")) return "product";
  if (r.includes("data") || r.includes("analyst") || r.includes("science") || r.includes("ml") || r.includes("machine")) return "data";
  if (r.includes("design") || r.includes("ux") || r.includes("figma")) return "design";
  return "general";
}

function getPathname() {
  const normalized = (window.location.pathname || "/").replace(/\/+$/, "");
  return normalized || "/";
}

function PageShell({ children }) {
  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", color: "#111827", minHeight: "100vh", background: "#f1f5f9" }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
      {children}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        button { transition: opacity 0.15s, transform 0.1s; }
        button:hover { opacity: 0.9; }
        button:active { transform: scale(0.97); }
      `}</style>
    </div>
  );
}

function SectionCard({ children, style }) {
  return (
    <div style={{ background: "white", border: "1.5px solid #e2e8f0", borderRadius: 14, padding: "1.75rem", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", ...style }}>
      {children}
    </div>
  );
}

function PrivacyCard() {
  return (
    <SectionCard>
      <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: "clamp(24px, 4vw, 30px)", fontWeight: 700, marginBottom: 8 }}>RolePrep Policy</h1>
      <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 32, lineHeight: 1.7 }}>Please read the following policies carefully before using RolePrep.</p>

      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>1. Privacy Policy</h2>
      <p style={{ marginBottom: 16, lineHeight: 1.7 }}>We collect minimal data required to operate the service:</p>
      <ul style={{ paddingLeft: 24, marginBottom: 16, lineHeight: 1.7 }}>
        <li style={{ marginBottom: 8 }}>Telegram user ID</li>
        <li style={{ marginBottom: 8 }}>Messages during interview</li>
        <li style={{ marginBottom: 8 }}>Payment status</li>
      </ul>
      <p style={{ marginBottom: 16, fontWeight: 600 }}>We do NOT sell or share user data.</p>

      <hr style={{ margin: "32px 0", borderColor: "#e5e7eb", borderStyle: "solid", borderWidth: "1px 0 0 0" }} />

      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>2. Payment Policy</h2>
      <ul style={{ paddingLeft: 24, marginBottom: 16, lineHeight: 1.7 }}>
        <li style={{ marginBottom: 8 }}>Payments are processed securely via <strong>Razorpay</strong></li>
        <li style={{ marginBottom: 8 }}>
          Two purchase options:
          <ul style={{ paddingLeft: 20, marginTop: 8 }}>
            <li style={{ marginBottom: 6 }}>Session-based access</li>
            <li style={{ marginBottom: 6 }}>Subscription-based access</li>
          </ul>
        </li>
        <li style={{ marginBottom: 8 }}>Service is digital and delivered instantly</li>
      </ul>

      <hr style={{ margin: "32px 0", borderColor: "#e5e7eb", borderStyle: "solid", borderWidth: "1px 0 0 0" }} />

      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>3. Refund Policy</h2>
      <div style={{ background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: 8, padding: "14px 18px", marginBottom: 16, fontWeight: 700, fontSize: 16, color: "#dc2626" }}>
        NO REFUNDS.
      </div>
      <p style={{ marginBottom: 12, fontWeight: 600 }}>Reason:</p>
      <ul style={{ paddingLeft: 24, marginBottom: 16, lineHeight: 1.7 }}>
        <li style={{ marginBottom: 8 }}>Service is digital</li>
        <li style={{ marginBottom: 8 }}>No physical product</li>
        <li style={{ marginBottom: 8 }}>User receives immediate access to interview system</li>
        <li style={{ marginBottom: 8 }}>Sessions and subscriptions are consumed instantly</li>
      </ul>
      <p style={{ marginBottom: 12, fontWeight: 600 }}>By making payment, user agrees:</p>
      <ul style={{ paddingLeft: 24, marginBottom: 16, lineHeight: 1.7 }}>
        <li style={{ marginBottom: 8 }}>They understand no refund will be issued</li>
        <li style={{ marginBottom: 8 }}>They accept terms before purchase</li>
      </ul>

      <hr style={{ margin: "32px 0", borderColor: "#e5e7eb", borderStyle: "solid", borderWidth: "1px 0 0 0" }} />

      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Contact</h2>
      <p style={{ marginBottom: 16, lineHeight: 1.7 }}>
        For any questions or concerns, reach us at{" "}
        <a href="mailto:sharmabishu001@gmail.com" style={{ color: "#2563eb", textDecoration: "none", fontWeight: 600 }}>
          sharmabishu001@gmail.com
        </a>
      </p>

      <hr style={{ margin: "40px 0", borderColor: "#e5e7eb", borderStyle: "solid", borderWidth: "1px 0 0 0" }} />
      <p style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.7 }}>
        &copy; {new Date().getFullYear()} RolePrep. All rights reserved.{" "}
        <a href="/" style={{ color: "#2563eb", textDecoration: "none" }}>
          Back to home
        </a>
      </p>
    </SectionCard>
  );
}

function PrivacyPage() {
  return (
    <PageShell>
      <div style={{ background: "#0f172a", color: "#f8fafc", padding: "3rem 1.5rem 2.5rem", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", background: "rgba(56,189,248,0.12)", border: "1px solid rgba(56,189,248,0.3)", color: "#7dd3fc", fontSize: 12, fontWeight: 600, padding: "5px 14px", borderRadius: 20, marginBottom: "1.25rem", letterSpacing: "0.05em" }}>
          RolePrep
        </div>
        <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 700, lineHeight: 1.15, marginBottom: "0.75rem" }}>
          Privacy, payment, and refund policy
        </h1>
        <p style={{ color: "#94a3b8", fontSize: 16, maxWidth: 560, margin: "0 auto", lineHeight: 1.65 }}>
          This page opens directly from the Telegram bot link at `/privacy`.
        </p>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "2.5rem 1.5rem 3rem" }}>
        <PrivacyCard />
      </div>
    </PageShell>
  );
}

function LandingPage() {
  const [role, setRole] = useState("");
  const [questionType, setQuestionType] = useState("behavioral");
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const isMobile = /iPhone|Android|iPad/i.test(navigator.userAgent);
  const telegramLink = isMobile ? TELEGRAM_BOT : TELEGRAM_WEB_BOT;

  function openTelegram() {
    window.open(telegramLink, "_blank");
  }

  function openPlan(plan) {
    setSelectedPlan(plan.id);
    window.open(telegramLink, "_blank");
  }

  function runDemo(overrideRole) {
    const currentRole = overrideRole !== undefined ? overrideRole : role;
    setQuestion(null);
    setLoading(true);
    setTimeout(() => {
      const category = getCategory(currentRole || "general");
      const pool = QUESTION_BANK[category];
      setQuestion({ text: pool[Math.floor(Math.random() * pool.length)], role: currentRole || "General", type: questionType });
      setLoading(false);
    }, 900);
  }

  const filteredSuggestions = ROLE_SUGGESTIONS.filter((item) => !role || item.toLowerCase().includes(role.toLowerCase()));

  return (
    <PageShell>
      <div style={{ background: "#0f172a", color: "#f8fafc", padding: "3.5rem 1.5rem 3rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 60% at 50% -10%, #1e3a5f 0%, transparent 70%)", pointerEvents: "none" }} />
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(56,189,248,0.12)", border: "1px solid rgba(56,189,248,0.3)", color: "#7dd3fc", fontSize: 12, fontWeight: 600, padding: "5px 14px", borderRadius: 20, marginBottom: "1.25rem", letterSpacing: "0.05em" }}>
          Telegram-based interview practice tool
        </div>
        <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: "clamp(26px, 5vw, 42px)", fontWeight: 700, lineHeight: 1.15, marginBottom: "1rem" }}>
          Ace your interview in <span style={{ color: "#38bdf8" }}>5 minutes</span> of practice
        </h1>
        <p style={{ color: "#94a3b8", fontSize: 16, maxWidth: 480, margin: "0 auto 1.5rem", lineHeight: 1.65 }}>
          Real, role-specific interview questions. No signup. No app download. Open Telegram and start instantly.
        </p>
        <div style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "11px 18px", fontSize: 13, color: "#cbd5e1", maxWidth: 460, margin: "0 auto 2rem", lineHeight: 1.6 }}>
          Works on mobile and desktop. Mobile opens the Telegram app, and desktop opens Telegram Web.
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 12 }}>
          <button onClick={openTelegram} style={{ background: "#2563eb", color: "white", border: "none", borderRadius: 10, padding: "14px 30px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 16px rgba(37,99,235,0.4)" }}>
            Start Practicing Now
          </button>
          <a href={TELEGRAM_WEB_BOT} target="_blank" rel="noopener noreferrer" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)", color: "#e2e8f0", borderRadius: 10, padding: "13px 22px", fontSize: 14, fontWeight: 500, textDecoration: "none" }}>
            Open in Telegram Web
          </a>
        </div>
      </div>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "2.5rem 1.5rem 3rem" }}>
        <SectionCard style={{ marginBottom: "1.25rem" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.09em", color: "#64748b", textTransform: "uppercase", marginBottom: "0.5rem" }}>Live demo</p>
          <p style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700, marginBottom: "0.3rem" }}>Try a real interview question</p>
          <p style={{ fontSize: 14, color: "#6b7280", marginBottom: "1.25rem", lineHeight: 1.5 }}>
            Enter your role and pick a question type. These are drawn from the same question bank used inside the bot.
          </p>

          <div style={{ position: "relative", marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Your target role</label>
            <input
              type="text"
              placeholder="e.g. Backend Developer, Product Manager..."
              value={role}
              onChange={(event) => {
                setRole(event.target.value);
                setShowSuggestions(true);
                setQuestion(null);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 160)}
              onKeyDown={(event) => event.key === "Enter" && runDemo()}
              style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, color: "#111827", background: "#f8fafc", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
            />
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1.5px solid #e2e8f0", borderTop: "none", borderRadius: "0 0 8px 8px", zIndex: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
                {filteredSuggestions.map((item) => (
                  <div
                    key={item}
                    onMouseDown={() => {
                      setRole(item);
                      setShowSuggestions(false);
                      setQuestion(null);
                    }}
                    style={{ padding: "10px 14px", fontSize: 14, color: "#374151", cursor: "pointer", borderBottom: "0.5px solid #f1f5f9" }}
                  >
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Question type</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["behavioral", "technical", "situational"].map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setQuestionType(type);
                    setQuestion(null);
                  }}
                  style={{ padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", border: questionType === type ? "2px solid #2563eb" : "1.5px solid #e2e8f0", background: questionType === type ? "#eff6ff" : "white", color: questionType === type ? "#2563eb" : "#6b7280" }}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <button onClick={() => runDemo()} style={{ background: "#2563eb", color: "white", border: "none", borderRadius: 9, padding: "12px 26px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 10px rgba(37,99,235,0.3)" }}>
            Generate question
          </button>

          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: "1.25rem", fontSize: 13, color: "#6b7280" }}>
              <div style={{ width: 14, height: 14, border: "2px solid #e5e7eb", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
              Pulling a {questionType} question{role ? ` for ${role}` : ""}...
            </div>
          )}

          {question && !loading && (
            <div style={{ marginTop: "1.25rem" }}>
              <div style={{ background: "#f0f7ff", border: "1.5px solid #bfdbfe", borderRadius: 10, padding: "16px 18px", marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#2563eb", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 10 }}>
                  {question.type} | {question.role}
                </div>
                <div style={{ fontSize: 15, color: "#1e293b", lineHeight: 1.7, fontWeight: 500 }}>{question.text}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <button onClick={() => runDemo()} style={{ padding: "8px 16px", background: "white", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#374151", fontFamily: "inherit" }}>
                  Another question
                </button>
                <button onClick={openTelegram} style={{ padding: "8px 16px", background: "#2563eb", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", color: "white", fontFamily: "inherit" }}>
                  Practice more on Telegram
                </button>
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard style={{ marginBottom: "1.25rem" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.09em", color: "#64748b", textTransform: "uppercase", marginBottom: "0.5rem" }}>Pricing</p>
          <p style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700, marginBottom: "0.3rem" }}>Simple, affordable plans</p>
          <p style={{ fontSize: 14, color: "#6b7280", marginBottom: "1.5rem" }}>Click any plan to open the bot and get started.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            {PLANS.map((plan) => (
              <button
                key={plan.id}
                onClick={() => openPlan(plan)}
                style={{ border: plan.featured ? "2px solid #2563eb" : "1.5px solid #e2e8f0", borderRadius: 12, padding: "1.4rem 1rem 1.2rem", textAlign: "center", background: selectedPlan === plan.id ? "#dbeafe" : plan.featured ? "#f0f7ff" : "white", cursor: "pointer", fontFamily: "inherit" }}
              >
                <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 700, color: plan.featured ? "#2563eb" : "#111827" }}>{plan.price}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginTop: 4 }}>{plan.name}</div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 3, marginBottom: 10 }}>{plan.desc}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.45, marginBottom: 14 }}>{plan.detail}</div>
                <div style={{ background: plan.featured ? "#2563eb" : "#1e293b", color: "white", borderRadius: 7, padding: "8px 12px", fontSize: 12, fontWeight: 700 }}>Get started</div>
              </button>
            ))}
          </div>
        </SectionCard>

        <SectionCard>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.09em", color: "#64748b", textTransform: "uppercase", marginBottom: "0.5rem" }}>Why RolePrep</p>
          <p style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700, marginBottom: "1.5rem" }}>Built for real preparation</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14 }}>
            {[
              { title: "Role-specific questions", desc: "Questions tailored to your exact target role." },
              { title: "Fast to start", desc: "Open Telegram, tap Start, and begin instantly." },
              { title: "Conversational format", desc: "Practice feels like a real interview, not a quiz app." },
              { title: "Mobile and desktop", desc: "Works on Telegram app and Telegram Web." },
            ].map((item) => (
              <div key={item.title} style={{ background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 10, padding: "1.1rem" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div style={{ textAlign: "center", padding: "1.75rem 1.5rem", fontSize: 13, color: "#94a3b8", borderTop: "1px solid #e2e8f0", background: "white" }}>
        RolePrep | Interview practice via Telegram |{" "}
        <a href={TELEGRAM_WEB_BOT} target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb", textDecoration: "none", fontWeight: 600 }}>
          @Roleprep_bot
        </a>{" "}
        |{" "}
        <a href="/privacy" style={{ color: "#2563eb", textDecoration: "none", fontWeight: 600 }}>
          Privacy & Policy
        </a>
      </div>
    </PageShell>
  );
}

export default function App() {
  const isPrivacyPage = getPathname() === "/privacy";

  useEffect(() => {
    document.title = isPrivacyPage ? "RolePrep Privacy Policy" : "RolePrep";
  }, [isPrivacyPage]);

  return isPrivacyPage ? <PrivacyPage /> : <LandingPage />;
}
