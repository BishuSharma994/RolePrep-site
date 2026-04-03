import { useState } from "react";

const TELEGRAM_BOT = "https://t.me/Roleprep_bot";
const TELEGRAM_WEB_BOT = "https://web.telegram.org/k/#@Roleprep_bot";

const QUESTION_BANK = {
  backend: [
    "Describe a time you had to optimize a slow database query. What was the problem and how did you fix it?",
    "How would you design a rate-limiting system for a high-traffic REST API?",
    "Walk me through how you would debug an intermittent 500 error in production.",
    "Tell me about a time you had to refactor a large codebase. What was your approach?",
    "How do you ensure data consistency when working with microservices?",
  ],
  frontend: [
    "How have you handled performance issues in a large React or JavaScript application?",
    "Describe your approach to making a web app fully accessible.",
    "Walk me through how you would debug a layout issue across multiple browsers.",
    "Tell me about a complex UI feature you built and the challenges you faced.",
    "How do you manage state in a large frontend application?",
  ],
  product: [
    "Tell me about a feature you shipped that didn't perform as expected. What did you learn?",
    "How do you prioritize between competing feature requests from different stakeholders?",
    "Describe a time you used data to challenge a strongly-held assumption on your team.",
    "How do you decide when a product is ready to ship vs. needs more work?",
    "Walk me through how you discovered and validated a new product opportunity.",
  ],
  data: [
    "Walk me through a data analysis where your findings were surprising or counterintuitive.",
    "How would you handle missing or inconsistent data in a large dataset?",
    "Describe a time you had to explain a complex insight to a non-technical audience.",
    "Tell me about a model you built that didn't work as expected. What did you do?",
    "How do you decide which metrics actually matter for a business problem?",
  ],
  design: [
    "Walk me through your design process for a feature from brief to final delivery.",
    "Describe a time you had to push back on a stakeholder's design direction.",
    "How do you balance user needs with technical or business constraints?",
    "Tell me about a design decision you made that you later changed. Why?",
    "How do you validate that a design actually solves the user's problem?",
  ],
  general: [
    "Tell me about a time you had to solve a problem with incomplete information.",
    "Describe a project where you had to learn something new quickly. What was your approach?",
    "Walk me through a situation where you disagreed with your team. How did you handle it?",
    "Tell me about a time you failed. What did you take away from it?",
    "Describe the most complex project you've worked on and your role in it.",
  ],
};

function getCategory(role) {
  const r = role.toLowerCase();
  if (r.includes("backend") || r.includes("node") || r.includes("python") || r.includes("java") || r.includes("server") || r.includes("devops") || r.includes("cloud")) return "backend";
  if (r.includes("frontend") || r.includes("react") || r.includes("vue") || r.includes("angular") || r.includes("ui developer") || r.includes("web dev")) return "frontend";
  if (r.includes("product") || r.includes("manager")) return "product";
  if (r.includes("data") || r.includes("analyst") || r.includes("science") || r.includes("ml") || r.includes("machine")) return "data";
  if (r.includes("design") || r.includes("ux") || r.includes("figma")) return "design";
  return "general";
}

const PLANS = [
  {
    id: "starter",
    price: "₹10",
    name: "Starter",
    desc: "1 session",
    detail: "Perfect for a quick practice run before a specific interview.",
    featured: false,
  },
  {
    id: "pack",
    price: "₹29",
    name: "Pack",
    desc: "5 sessions",
    detail: "Best for focused prep over a week. Save 42% vs Starter.",
    featured: true,
  },
  {
    id: "unlimited",
    price: "₹99",
    name: "Unlimited",
    desc: "28 days",
    detail: "Full access for a month. Ideal for active job seekers.",
    featured: false,
  },
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

export default function App() {
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
    const r = overrideRole !== undefined ? overrideRole : role;
    setQuestion(null);
    setLoading(true);
    setTimeout(() => {
      const cat = getCategory(r || "general");
      const pool = QUESTION_BANK[cat];
      const q = pool[Math.floor(Math.random() * pool.length)];
      setQuestion({ text: q, role: r || "General", type: questionType });
      setLoading(false);
    }, 900);
  }

  function pickSuggestion(s) {
    setRole(s);
    setShowSuggestions(false);
    setQuestion(null);
  }

  const filteredSuggestions = ROLE_SUGGESTIONS.filter(
    (s) => !role || s.toLowerCase().includes(role.toLowerCase())
  );

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", color: "#111827", minHeight: "100vh", background: "#f1f5f9" }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />

      {/* ── HERO ── */}
      <div style={{ background: "#0f172a", color: "#f8fafc", padding: "3.5rem 1.5rem 3rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 60% at 50% -10%, #1e3a5f 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(56,189,248,0.12)", border: "1px solid rgba(56,189,248,0.3)", color: "#7dd3fc", fontSize: 12, fontWeight: 600, padding: "5px 14px", borderRadius: 20, marginBottom: "1.25rem", letterSpacing: "0.05em" }}>
          <span style={{ width: 6, height: 6, background: "#38bdf8", borderRadius: "50%", display: "inline-block" }} />
          Telegram-based interview practice tool
        </div>

        <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: "clamp(26px, 5vw, 42px)", fontWeight: 700, lineHeight: 1.15, marginBottom: "1rem" }}>
          Ace your interview in{" "}
          <span style={{ color: "#38bdf8" }}>5 minutes</span>{" "}
          of practice
        </h1>

        <p style={{ color: "#94a3b8", fontSize: 16, maxWidth: 480, margin: "0 auto 1.5rem", lineHeight: 1.65 }}>
          Real, role-specific interview questions. No signup. No app download. Open Telegram and start instantly.
        </p>

        <div style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "11px 18px", fontSize: 13, color: "#cbd5e1", maxWidth: 460, margin: "0 auto 2rem", lineHeight: 1.6, display: "flex", alignItems: "flex-start", gap: 10, textAlign: "left" }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
          <span>
            Works on <strong style={{ color: "#f1f5f9" }}>mobile</strong> (opens Telegram app) and{" "}
            <strong style={{ color: "#f1f5f9" }}>desktop</strong> (opens Telegram Web) — both go directly to the bot.
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 12 }}>
          <button
            onClick={openTelegram}
            style={{ display: "inline-flex", alignItems: "center", gap: 9, background: "#2563eb", color: "white", border: "none", borderRadius: 10, padding: "14px 30px", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 16px rgba(37,99,235,0.4)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 13.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z" />
            </svg>
            Start Practicing Now
          </button>
          <a
            href={TELEGRAM_WEB_BOT}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)", color: "#e2e8f0", borderRadius: 10, padding: "13px 22px", fontSize: 14, fontWeight: 500, textDecoration: "none" }}
          >
            🌐 Open in Telegram Web
          </a>
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "2.5rem 1.5rem 3rem" }}>

        {/* Steps */}
        <div style={{ marginBottom: "1.75rem" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.09em", color: "#64748b", textTransform: "uppercase", marginBottom: "0.85rem" }}>How it works</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", background: "white", border: "1.5px solid #e2e8f0", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            {[
              { num: 1, icon: "👆", text: "Tap the button above" },
              { num: 2, icon: "📱", text: "Telegram opens automatically" },
              { num: 3, icon: "▶️", text: "Click the Start button" },
              { num: 4, icon: "🎯", text: "Interview begins instantly" },
            ].map((s, i) => (
              <div key={i} style={{ padding: "1.4rem 0.85rem 1.2rem", textAlign: "center", borderRight: i < 3 ? "1.5px solid #e2e8f0" : "none", position: "relative" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #2563eb, #38bdf8)" }} />
                <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ width: 22, height: 22, background: "#eff6ff", color: "#2563eb", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 11, margin: "0 auto 8px", border: "1.5px solid #bfdbfe" }}>{s.num}</div>
                <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.4, fontWeight: 500 }}>{s.text}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Demo */}
        <div style={{ background: "white", border: "1.5px solid #e2e8f0", borderRadius: 14, padding: "1.75rem", marginBottom: "1.25rem", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.09em", color: "#64748b", textTransform: "uppercase", marginBottom: "0.5rem" }}>Live demo</p>
          <p style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700, marginBottom: "0.3rem" }}>Try a real interview question</p>
          <p style={{ fontSize: 14, color: "#6b7280", marginBottom: "1.25rem", lineHeight: 1.5 }}>
            Enter your role and pick a question type. These are drawn from the same question bank used inside the bot.
          </p>

          {/* Role input */}
          <div style={{ position: "relative", marginBottom: "1rem" }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Your target role</label>
            <input
              type="text"
              placeholder="e.g. Backend Developer, Product Manager..."
              value={role}
              onChange={(e) => { setRole(e.target.value); setShowSuggestions(true); setQuestion(null); }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 160)}
              onKeyDown={(e) => e.key === "Enter" && runDemo()}
              style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, color: "#111827", background: "#f8fafc", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
            />
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "white", border: "1.5px solid #e2e8f0", borderTop: "none", borderRadius: "0 0 8px 8px", zIndex: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
                {filteredSuggestions.map((s) => (
                  <div
                    key={s}
                    onMouseDown={() => pickSuggestion(s)}
                    style={{ padding: "10px 14px", fontSize: 14, color: "#374151", cursor: "pointer", borderBottom: "0.5px solid #f1f5f9" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                  >
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Question type */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 8 }}>Question type</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                { id: "behavioral", label: "💬 Behavioral" },
                { id: "technical", label: "⚙️ Technical" },
                { id: "situational", label: "🧩 Situational" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setQuestionType(t.id); setQuestion(null); }}
                  style={{ padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", border: questionType === t.id ? "2px solid #2563eb" : "1.5px solid #e2e8f0", background: questionType === t.id ? "#eff6ff" : "white", color: questionType === t.id ? "#2563eb" : "#6b7280", transition: "all 0.15s" }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => runDemo()}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#2563eb", color: "white", border: "none", borderRadius: 9, padding: "12px 26px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 10px rgba(37,99,235,0.3)" }}
          >
            ⚡ Generate question
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
                  {question.type} · {question.role}
                </div>
                <div style={{ fontSize: 15, color: "#1e293b", lineHeight: 1.7, fontWeight: 500 }}>{question.text}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={() => runDemo()}
                  style={{ padding: "8px 16px", background: "white", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", color: "#374151", fontFamily: "inherit" }}
                >
                  🔄 Another question
                </button>
                <button
                  onClick={openTelegram}
                  style={{ padding: "8px 16px", background: "#2563eb", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", color: "white", fontFamily: "inherit" }}
                >
                  Practice more on Telegram →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pricing */}
        <div style={{ background: "white", border: "1.5px solid #e2e8f0", borderRadius: 14, padding: "1.75rem", marginBottom: "1.25rem", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.09em", color: "#64748b", textTransform: "uppercase", marginBottom: "0.5rem" }}>Pricing</p>
          <p style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700, marginBottom: "0.3rem" }}>Simple, affordable plans</p>
          <p style={{ fontSize: 14, color: "#6b7280", marginBottom: "1.5rem" }}>
            Click any plan to open the bot and get started. Payment is handled securely inside Telegram.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12, marginBottom: "0.75rem" }}>
            {PLANS.map((plan) => (
              <button
                key={plan.id}
                onClick={() => openPlan(plan)}
                style={{
                  border: plan.featured ? "2px solid #2563eb" : "1.5px solid #e2e8f0",
                  borderRadius: 12,
                  padding: "1.4rem 1rem 1.2rem",
                  textAlign: "center",
                  position: "relative",
                  background: selectedPlan === plan.id ? "#dbeafe" : plan.featured ? "#f0f7ff" : "white",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  boxShadow: plan.featured ? "0 4px 14px rgba(37,99,235,0.15)" : "none",
                  transition: "all 0.15s",
                }}
              >
                {plan.featured && (
                  <div style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", background: "#2563eb", color: "white", fontSize: 10, fontWeight: 700, padding: "3px 12px", borderRadius: 20, whiteSpace: "nowrap", letterSpacing: "0.05em" }}>
                    BEST VALUE
                  </div>
                )}
                <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 700, color: plan.featured ? "#2563eb" : "#111827" }}>{plan.price}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginTop: 4 }}>{plan.name}</div>
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 3, marginBottom: 10 }}>{plan.desc}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.45, marginBottom: 14 }}>{plan.detail}</div>
                <div style={{ background: plan.featured ? "#2563eb" : "#1e293b", color: "white", borderRadius: 7, padding: "8px 12px", fontSize: 12, fontWeight: 700 }}>
                  Get started →
                </div>
              </button>
            ))}
          </div>

          <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", marginTop: 10 }}>
            💳 No hidden charges · Payment handled inside the bot
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: "1rem", justifyContent: "center" }}>
            {["No signup required", "Instant access", "Works on all devices", "Secure payment"].map((t) => (
              <span key={t} style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 20, padding: "5px 13px", fontSize: 12, color: "#64748b", fontWeight: 500 }}>{t}</span>
            ))}
          </div>
        </div>

        {/* Why RolePrep */}
        <div style={{ background: "white", border: "1.5px solid #e2e8f0", borderRadius: 14, padding: "1.75rem", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.09em", color: "#64748b", textTransform: "uppercase", marginBottom: "0.5rem" }}>Why RolePrep</p>
          <p style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700, marginBottom: "1.5rem" }}>Built for real preparation</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14 }}>
            {[
              { icon: "🎯", title: "Role-specific questions", desc: "Questions tailored to your exact target role — not generic templates." },
              { icon: "⚡", title: "Under a minute to start", desc: "Open Telegram, tap Start. No forms, no onboarding, no waiting." },
              { icon: "💬", title: "Conversational format", desc: "Practice feels like a real interview, not a quiz app." },
              { icon: "📱", title: "Mobile & desktop", desc: "Works on Telegram app (mobile) and Telegram Web (desktop)." },
            ].map((item) => (
              <div key={item.title} style={{ background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 10, padding: "1.1rem" }}>
                <div style={{ fontSize: 24, marginBottom: 10 }}>{item.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "1.75rem 1.5rem", fontSize: 13, color: "#94a3b8", borderTop: "1px solid #e2e8f0", background: "white" }}>
        RolePrep · Interview practice via Telegram ·{" "}
        <a href={TELEGRAM_WEB_BOT} target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb", textDecoration: "none", fontWeight: 600 }}>
          @Roleprep_bot
        </a>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        button { transition: opacity 0.15s, transform 0.1s; }
        button:hover { opacity: 0.9; }
        button:active { transform: scale(0.97); }
      `}</style>
    </div>
  );
}