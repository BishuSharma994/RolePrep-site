import { useState } from "react";

const questions = {
  default: [
    "Walk me through a time you had to solve a problem with incomplete information. How did you approach it?",
    "Describe a project where you had to learn something new quickly. What was your process?",
    "Tell me about a situation where you disagreed with a decision. How did you handle it?",
  ],
  backend: [
    "Describe a challenging bug you fixed and how you diagnosed the root cause.",
    "How would you design a rate-limiting system for a high-traffic API?",
    "Explain a time you had to optimize a slow database query. What steps did you take?",
  ],
  frontend: [
    "How have you handled performance issues in a large React application?",
    "Describe your approach to making a web app accessible to all users.",
    "Walk me through how you would debug a layout issue across multiple browsers.",
  ],
  product: [
    "Tell me about a feature you shipped that didn't perform as expected. What did you learn?",
    "How do you prioritize between competing feature requests from different stakeholders?",
    "Describe a time you used data to change a product decision.",
  ],
  data: [
    "Walk me through a data analysis project where your findings surprised you.",
    "How would you handle missing or inconsistent data in a large dataset?",
    "Describe a time you had to explain a complex finding to a non-technical audience.",
  ],
};

function getCategory(role) {
  const r = role.toLowerCase();
  if (r.includes("backend") || r.includes("node") || r.includes("python") || r.includes("java") || r.includes("server")) return "backend";
  if (r.includes("frontend") || r.includes("react") || r.includes("ui") || r.includes("css") || r.includes("web")) return "frontend";
  if (r.includes("product") || r.includes("pm") || r.includes("manager")) return "product";
  if (r.includes("data") || r.includes("analyst") || r.includes("science")) return "data";
  return "default";
}

export default function App() {
  const [role, setRole] = useState("");
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(false);

  const telegramLink = "https://t.me/Roleprep_bot";

  function runDemo() {
    setQuestion(null);
    setLoading(true);
    setTimeout(() => {
      const cat = getCategory(role || "general");
      const pool = questions[cat];
      const q = pool[Math.floor(Math.random() * pool.length)];
      setQuestion(q);
      setLoading(false);
    }, 1200);
  }

  const steps = [
    { num: 1, text: "Click the button above" },
    { num: 2, text: "Telegram opens automatically" },
    { num: 3, text: "Tap the blue Start button" },
    { num: 4, text: "Your interview begins instantly" },
  ];

  const plans = [
    { price: "₹10", name: "Starter", desc: "1 session", featured: false },
    { price: "₹29", name: "Pack", desc: "5 sessions", featured: true },
    { price: "₹99", name: "Unlimited", desc: "28 days", featured: false },
  ];

  const whyItems = [
    { icon: "🎯", title: "Role-specific questions", desc: "Every question is tailored to your target role — no generic filler content." },
    { icon: "⚡", title: "Ready in under a minute", desc: "Open the bot, tap Start, and your practice session begins immediately." },
    { icon: "📱", title: "Works wherever you are", desc: "Runs entirely through Telegram — no app install, no account creation needed." },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", color: "#111827", minHeight: "100vh", background: "#f1f5f9" }}>
      <link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />

      {/* ── HERO ── */}
      <div style={{ background: "#0f172a", color: "#f8fafc", padding: "3.5rem 1.5rem 3rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 60% at 50% -10%, #1e3a5f 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(56,189,248,0.12)", border: "1px solid rgba(56,189,248,0.3)", color: "#7dd3fc", fontSize: 12, fontWeight: 500, padding: "5px 14px", borderRadius: 20, marginBottom: "1.25rem", letterSpacing: "0.04em" }}>
          <span style={{ width: 6, height: 6, background: "#38bdf8", borderRadius: "50%", display: "inline-block" }} />
          Telegram-based interview practice tool
        </div>

        <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: "clamp(26px, 5vw, 40px)", fontWeight: 700, lineHeight: 1.2, marginBottom: "1rem" }}>
          Ace your interview in{" "}
          <span style={{ color: "#38bdf8" }}>5 minutes</span>{" "}
          of practice
        </h1>

        <p style={{ color: "#94a3b8", fontSize: 16, maxWidth: 480, margin: "0 auto 1.5rem", lineHeight: 1.6 }}>
          Get real, role-specific interview questions instantly. No signup. No app download. Just open Telegram and start.
        </p>

        <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 16px", fontSize: 13, color: "#cbd5e1", maxWidth: 420, margin: "0 auto 1.75rem", lineHeight: 1.5 }}>
          Clicking the button below opens Telegram directly — the bot is ready to start immediately.
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: 10 }}>
          <a href={telegramLink} target="_blank" rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#2563eb", color: "white", borderRadius: 8, padding: "13px 28px", fontSize: 15, fontWeight: 600, textDecoration: "none" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 13.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z" />
            </svg>
            Open Bot in Telegram
          </a>
          <a href="https://web.telegram.org" target="_blank" rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "1px solid rgba(255,255,255,0.2)", color: "#94a3b8", borderRadius: 8, padding: "11px 20px", fontSize: 14, textDecoration: "none" }}>
            Open Telegram Web ↗
          </a>
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "2.5rem 1.5rem 3rem" }}>

        {/* How it works */}
        <div style={{ marginBottom: "1.75rem" }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#64748b", textTransform: "uppercase", marginBottom: "0.85rem" }}>
            How it works
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", background: "white", border: "1.5px solid #e2e8f0", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            {steps.map((step, i) => (
              <div key={i} style={{
                padding: "1.4rem 1rem",
                textAlign: "center",
                borderRight: i < 3 ? "1.5px solid #e2e8f0" : "none",
                background: "white",
                position: "relative",
              }}>
                {/* top accent bar */}
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #2563eb, #38bdf8)" }} />
                <div style={{
                  width: 36, height: 36,
                  background: "#eff6ff",
                  color: "#2563eb",
                  borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: 14,
                  margin: "0 auto 10px",
                  border: "1.5px solid #bfdbfe",
                }}>
                  {step.num}
                </div>
                <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.45, fontWeight: 500 }}>{step.text}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Demo */}
        <div style={{ background: "white", border: "1.5px solid #e2e8f0", borderRadius: 14, padding: "1.5rem", marginBottom: "1.25rem", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#64748b", textTransform: "uppercase", marginBottom: "0.5rem" }}>Live demo</p>
          <p style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700, marginBottom: "0.25rem" }}>Try a sample question</p>
          <p style={{ fontSize: 14, color: "#6b7280", marginBottom: "1rem" }}>Enter your target role to preview the type of question you will receive.</p>

          <input
            type="text"
            placeholder="e.g. Backend Developer, Product Manager..."
            value={role}
            onChange={(e) => setRole(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runDemo()}
            style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, color: "#111827", background: "#f8fafc", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }}
          />

          <button onClick={runDemo}
            style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 6, background: "#2563eb", color: "white", border: "none", borderRadius: 8, padding: "11px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            Generate question
          </button>

          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: "1rem", fontSize: 13, color: "#6b7280" }}>
              <div style={{ width: 14, height: 14, border: "2px solid #e5e7eb", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
              Generating a question for your role...
            </div>
          )}

          {question && !loading && (
            <div style={{ marginTop: "1rem", background: "#f0f7ff", borderLeft: "3px solid #2563eb", borderRadius: "0 8px 8px 0", padding: "14px 16px" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#2563eb", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>Interview question</div>
              <div style={{ fontSize: 15, color: "#1e293b", lineHeight: 1.65 }}>{question}</div>
            </div>
          )}
        </div>

        {/* Pricing */}
        <div style={{ background: "white", border: "1.5px solid #e2e8f0", borderRadius: 14, padding: "1.5rem", marginBottom: "1.25rem", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#64748b", textTransform: "uppercase", marginBottom: "0.5rem" }}>Pricing</p>
          <p style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700, marginBottom: "0.25rem" }}>Simple, affordable plans</p>
          <p style={{ fontSize: 14, color: "#6b7280", marginBottom: "1.25rem" }}>No subscriptions. Pay only for what you need.</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12, marginBottom: "1.25rem" }}>
            {plans.map((plan) => (
              <div key={plan.name} style={{
                border: plan.featured ? "2px solid #2563eb" : "1.5px solid #e2e8f0",
                borderRadius: 12, padding: "1.25rem 1rem",
                textAlign: "center", position: "relative",
                background: plan.featured ? "#f0f7ff" : "white",
              }}>
                {plan.featured && (
                  <div style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", background: "#2563eb", color: "white", fontSize: 10, fontWeight: 700, padding: "3px 12px", borderRadius: 20, whiteSpace: "nowrap", letterSpacing: "0.05em" }}>
                    BEST VALUE
                  </div>
                )}
                <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 26, fontWeight: 700, color: plan.featured ? "#2563eb" : "#111827" }}>{plan.price}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginTop: 4 }}>{plan.name}</div>
                <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>{plan.desc}</div>
              </div>
            ))}
          </div>

          <a href={telegramLink} target="_blank" rel="noopener noreferrer"
            style={{ display: "block", textAlign: "center", background: "#2563eb", color: "white", borderRadius: 10, padding: "13px", fontSize: 15, fontWeight: 600, textDecoration: "none" }}>
            Get started on Telegram
          </a>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: "1rem" }}>
            {["No signup required", "Instant access via Telegram", "Works on all devices", "Pay securely"].map((t) => (
              <span key={t} style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 20, padding: "5px 13px", fontSize: 12, color: "#64748b", fontWeight: 500 }}>{t}</span>
            ))}
          </div>
        </div>

        {/* Why RolePrep */}
        <div style={{ background: "white", border: "1.5px solid #e2e8f0", borderRadius: 14, padding: "1.5rem", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "#64748b", textTransform: "uppercase", marginBottom: "0.5rem" }}>Why RolePrep</p>
          <p style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 700, marginBottom: "1.25rem" }}>Built for quick, focused prep</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {whyItems.map((item) => (
              <div key={item.title} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{ width: 40, height: 40, background: "#eff6ff", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0, border: "1px solid #bfdbfe" }}>
                  {item.icon}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", marginBottom: 3 }}>{item.title}</div>
                  <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.55 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "1.5rem", fontSize: 12, color: "#9ca3af", borderTop: "1px solid #e2e8f0", background: "white" }}>
        RolePrep · Interview practice via Telegram ·{" "}
        <a href={telegramLink} target="_blank" rel="noopener noreferrer" style={{ color: "#2563eb", textDecoration: "none" }}>
          @Roleprep_bot
        </a>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}