import { useState } from "react";

function App() {
  const [role, setRole] = useState("");
  const [showDemo, setShowDemo] = useState(false);

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        color: "#000000",
        minHeight: "100vh",
        width: "100%",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "40px 20px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <section style={{ marginBottom: "50px" }}>
          <h1 style={{ marginTop: 0 }}>Practice real interview questions in 5 minutes</h1>
          <p>Get instant interview practice before your next interview</p>
          <a href="https://t.me/Roleprep_bot?start=web">
            <button style={{ padding: "10px 20px", cursor: "pointer", marginTop: "16px" }}>
              Start on Telegram
            </button>
          </a>
        </section>

        <section style={{ marginBottom: "50px" }}>
          <h2>Try Demo</h2>
          <input
            type="text"
            placeholder="Enter role (e.g. Backend Developer)"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{ padding: "10px", width: "100%", marginBottom: "10px" }}
          />
          <button
            onClick={() => setShowDemo(true)}
            style={{ padding: "10px 20px", cursor: "pointer" }}
          >
            Start Demo
          </button>

          {showDemo && (
            <div
              style={{
                marginTop: "20px",
                padding: "10px",
                border: "1px solid #ccc",
              }}
            >
              <strong>Question:</strong>
              <p>Tell me about a challenging bug you fixed.</p>
            </div>
          )}
        </section>

        <section style={{ marginBottom: "50px" }}>
          <h2>How It Works</h2>
          <ol style={{ paddingLeft: "20px" }}>
            <li>Open Telegram bot</li>
            <li>Choose your role</li>
            <li>Start interview</li>
            <li>Get instant questions</li>
          </ol>
        </section>

        <section style={{ marginBottom: "50px" }}>
          <h2>Pricing</h2>
          <p>Rs 10 - 1 session</p>
          <p>Rs 29 - 5 sessions</p>
          <p>Rs 99 - 28 days unlimited</p>
          <a href="https://t.me/Roleprep_bot?start=pricing">
            <button style={{ padding: "10px 20px", cursor: "pointer", marginTop: "16px" }}>
              Get Started
            </button>
          </a>
        </section>

        <section style={{ marginBottom: "50px" }}>
          <h2>Why RolePrep</h2>
          <ul style={{ paddingLeft: "20px" }}>
            <li>Real interview-style questions</li>
            <li>Role-specific preparation</li>
            <li>Fast and simple practice</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

export default App;
