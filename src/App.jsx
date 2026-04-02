import { useState } from "react";

function App() {
  const [role, setRole] = useState("");
  const [showDemo, setShowDemo] = useState(false);
  const telegramLink = "https://web.telegram.org/a/#@Roleprep_bot";

  const primaryButtonStyle = {
    marginTop: "20px",
    padding: "12px 24px",
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "600",
  };

  const cardStyle = {
    background: "white",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  };

  const sectionTitleStyle = {
    fontSize: "24px",
    fontWeight: "700",
    margin: "0 0 12px",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f9fafb",
        color: "#111827",
        fontFamily: "system-ui, Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "40px 20px",
        }}
      >
        <section style={{ marginBottom: "30px", textAlign: "center" }}>
          <h1
            style={{
              fontSize: "32px",
              fontWeight: "700",
              margin: 0,
            }}
          >
            Practice real interview questions in 5 minutes
          </h1>
          <p
            style={{
              color: "#6b7280",
              marginTop: "10px",
              fontSize: "16px",
            }}
          >
            Get instant interview practice before your next interview.
          </p>
          <a href={telegramLink} target="_blank" rel="noopener noreferrer">
            <button style={primaryButtonStyle}>Start on Telegram</button>
          </a>
          <p style={{ marginTop: "10px", fontSize: "14px", color: "#6b7280" }}>
            If Telegram does not open, search "RolePrep" in Telegram.
          </p>
        </section>

        <section style={{ marginBottom: "30px" }}>
          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>Try Demo</h2>
            <p style={{ margin: "0 0 16px", color: "#6b7280" }}>
              Enter your target role and preview the kind of interview question you will get.
            </p>
            <input
              type="text"
              placeholder="Enter role (e.g. Backend Developer)"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #d1d5db",
                borderRadius: "6px",
                fontSize: "15px",
                color: "#111827",
              }}
            />
            <button
              onClick={() => setShowDemo(true)}
              style={primaryButtonStyle}
            >
              Start Demo
            </button>

            {showDemo && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "16px",
                  borderRadius: "8px",
                  backgroundColor: "#eff6ff",
                  border: "1px solid #bfdbfe",
                }}
              >
                <strong style={{ display: "block", marginBottom: "8px" }}>Question</strong>
                <p style={{ margin: 0, lineHeight: "1.7" }}>
                  Tell me about a challenging bug you fixed and how you approached the solution.
                </p>
              </div>
            )}
          </div>
        </section>

        <section style={{ marginBottom: "30px" }}>
          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>How It Works</h2>
            <ol style={{ paddingLeft: "20px", margin: 0, lineHeight: "1.8" }}>
              <li>Open Telegram bot</li>
              <li>Choose your role</li>
              <li>Start interview</li>
              <li>Get instant questions</li>
            </ol>
          </div>
        </section>

        <section style={{ marginBottom: "30px" }}>
          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>Pricing</h2>
            <div style={{ marginBottom: "8px" }}>Rs 10 - 1 session</div>
            <div style={{ marginBottom: "8px" }}>Rs 29 - 5 sessions</div>
            <div style={{ marginBottom: "8px" }}>Rs 99 - 28 days unlimited</div>
            <a href={telegramLink} target="_blank" rel="noopener noreferrer">
              <button style={primaryButtonStyle}>Get Started</button>
            </a>
            <p style={{ marginTop: "10px", fontSize: "14px", color: "#6b7280" }}>
              If Telegram does not open, search "RolePrep" in Telegram.
            </p>
          </div>
        </section>

        <section style={{ marginBottom: "30px" }}>
          <div style={cardStyle}>
            <h2 style={sectionTitleStyle}>Why RolePrep</h2>
            <ul style={{ paddingLeft: "20px", margin: 0, lineHeight: "1.8" }}>
              <li>Real interview-style questions tailored to your target role.</li>
              <li>Fast, simple practice when you need a quick confidence boost.</li>
              <li>Focused preparation without long setup or complicated flows.</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}

export default App;
