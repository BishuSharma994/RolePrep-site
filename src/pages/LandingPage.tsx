import { memo, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, ArrowRight, FileUp, Mic, Sparkles, Target } from "lucide-react";
import ScoreTrendChart from "../components/ScoreTrendChart";
import SupportFooter from "../components/SupportFooter";

const PREVIEW_STATES = [
  {
    title: "Question live",
    subtitle: "Walk me through a time you handled a high-stakes stakeholder conflict.",
    timer: "00:41",
    status: "Mic live. Listening for structure, confidence, and relevance.",
  },
  {
    title: "Analyzing response",
    subtitle: "Scoring clarity, delivery, specificity, and role fit in real time.",
    timer: "Processing",
    status: "Comparing your answer against the role context and interview stage.",
  },
  {
    title: "Feedback ready",
    subtitle: "82 score. Strong structure. Push harder on measurable impact.",
    timer: "82 / 100",
    status: "Strengths: calm delivery, clear arc. Weak areas: proof points, tighter ending.",
  },
] as const;

const FLOW_STEPS = [
  {
    icon: FileUp,
    title: "Upload Resume / Select Role",
    text: "Set the target role, add your resume context, and give the simulator the right brief.",
  },
  {
    icon: Mic,
    title: "AI Conducts Interview",
    text: "Answer live questions under time pressure with a voice-first interview loop.",
  },
  {
    icon: Target,
    title: "Get Score + Weak Areas",
    text: "Track scores, recurring weak spots, and what to repeat before the real interview.",
  },
];

const DASHBOARD_PREVIEW = [
  { label: "S1", score: 54 },
  { label: "S2", score: 61 },
  { label: "S3", score: 67 },
  { label: "S4", score: 72 },
  { label: "S5", score: 79 },
  { label: "S6", score: 83 },
];

const WEAK_AREAS = ["Communication", "Technical depth", "Confidence", "Story structure"];

const SimulationPreviewCard = memo(function SimulationPreviewCard() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((value) => (value + 1) % PREVIEW_STATES.length);
    }, 2000);

    return () => window.clearInterval(interval);
  }, []);

  const state = PREVIEW_STATES[activeIndex];
  const isAnalyzing = activeIndex === 1;
  const isFeedback = activeIndex === 2;

  return (
    <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,24,38,0.96),rgba(8,11,20,0.94))] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.35)] sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-accent">Live simulation</p>
          <h3 className="mt-2 font-display text-3xl leading-none tracking-[0.05em] text-slate-50">Pressure-test mode</h3>
        </div>
        <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm uppercase tracking-[0.18em] text-slate-200">
          {state.timer}
        </div>
      </div>

      <div className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
        <div className="flex items-center gap-2">
          <div className={`h-2.5 w-2.5 rounded-full ${isAnalyzing ? "bg-amber-300" : isFeedback ? "bg-accent" : "bg-rose-400"} ${!isFeedback ? "animate-pulse" : ""}`} />
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{state.title}</p>
        </div>
        <p className="mt-4 text-xl leading-9 text-slate-50 sm:text-2xl">{state.subtitle}</p>
        <p className="mt-4 text-sm leading-7 text-slate-300">{state.status}</p>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm uppercase tracking-[0.16em] text-slate-400">Mode</p>
          <p className="mt-3 text-lg font-medium text-slate-50">{isAnalyzing ? "Scoring" : "Live"}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm uppercase tracking-[0.16em] text-slate-400">Pressure</p>
          <p className="mt-3 text-lg font-medium text-slate-50">Timed</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm uppercase tracking-[0.16em] text-slate-400">Output</p>
          <p className="mt-3 text-lg font-medium text-slate-50">Feedback</p>
        </div>
      </div>
    </div>
  );
});

export default function LandingPage() {
  const previewAreas = useMemo(() => WEAK_AREAS, []);

  return (
    <div className="min-h-dvh bg-[#070b14] noise-overlay">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_top,_rgba(244,180,76,0.18),_transparent_38%),radial-gradient(circle_at_20%_20%,_rgba(0,255,136,0.12),_transparent_30%),radial-gradient(circle_at_80%_20%,_rgba(74,144,226,0.14),_transparent_30%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <section className="grid items-center gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-[0.28em] text-accent">Interview operating system</p>
            <h1 className="mt-4 font-display text-5xl leading-[0.92] tracking-[0.05em] text-slate-50 sm:text-6xl lg:text-7xl">
              Practice Real Interviews Under Pressure
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              Voice-based AI interviews with scoring and feedback. Step in, answer under time pressure, and see exactly what to improve before the real call.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/interview"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(90deg,#00ff88,#f4b44c)] px-6 py-3.5 text-base font-medium text-[#07110c] shadow-[0_20px_40px_rgba(0,255,136,0.18)] transition-transform duration-200 ease-in-out hover:scale-[1.02]"
              >
                Start Interview
                <ArrowRight size={18} />
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.04] px-6 py-3.5 text-base text-slate-100 transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.06]"
              >
                See Dashboard
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                ["Voice simulation", "Timed interview loop"],
                ["Structured feedback", "Score + weak areas"],
                ["Retention-ready", "Return and retry flow"],
              ].map(([label, text]) => (
                <div key={label} className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4 transition-all duration-200 ease-in-out hover:-translate-y-1 hover:bg-white/[0.06]">
                  <p className="text-sm uppercase tracking-[0.16em] text-slate-400">{label}</p>
                  <p className="mt-2 text-base leading-7 text-slate-100">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <SimulationPreviewCard />
        </section>

        <section className="mt-10">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-amber-300" />
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400">How the system works</p>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {FLOW_STEPS.map((step) => (
              <div
                key={step.title}
                className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,24,38,0.95),rgba(8,11,20,0.92))] p-5 transition-all duration-200 ease-in-out hover:-translate-y-1 hover:border-accent/20 hover:shadow-[0_24px_60px_rgba(0,0,0,0.3)]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-accent">
                  <step.icon size={20} />
                </div>
                <h3 className="mt-4 text-2xl font-medium text-slate-50">{step.title}</h3>
                <p className="mt-3 text-base leading-8 text-slate-300">{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,24,38,0.95),rgba(8,11,20,0.94))] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.32)] sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Dashboard preview</p>
              <h2 className="mt-2 font-display text-4xl leading-none tracking-[0.05em] text-slate-50">Analytics that make the next session obvious</h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-4 py-2 text-sm text-accent">
              <Activity size={16} />
              Live interview analytics
            </div>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
              <ScoreTrendChart data={DASHBOARD_PREVIEW} />
            </div>
            <div className="grid gap-4">
              <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Weak areas</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {previewAreas.map((area) => (
                    <span key={area} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-slate-100">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  ["Sessions", "18"],
                  ["Avg score", "74"],
                  ["Streak", "6 days"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-sm uppercase tracking-[0.16em] text-slate-400">{label}</p>
                    <p className="mt-3 font-display text-3xl tracking-[0.05em] text-slate-50">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <SupportFooter className="mt-10" />
      </div>
    </div>
  );
}
