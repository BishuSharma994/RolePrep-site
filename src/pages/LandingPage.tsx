import { memo, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, ArrowRight, FileText, Mic, Sparkles, Target, TrendingUp } from "lucide-react";
import ScoreTrendChart from "../components/ScoreTrendChart";
import SupportFooter from "../components/SupportFooter";

const PREVIEW_STATES = [
  {
    label: "Question live",
    prompt: "Tell me about a time you had to recover a project that was already slipping.",
    meta: "00:52 remaining",
    tone: "question",
  },
  {
    label: "Mic active",
    prompt: "Listening for clarity, confidence, and how quickly you get to the point.",
    meta: "Listening",
    tone: "listening",
  },
  {
    label: "Analyzing",
    prompt: "Scoring structure, delivery, specificity, and role fit against your brief.",
    meta: "Analyzing...",
    tone: "processing",
  },
  {
    label: "Feedback",
    prompt: "81 score. Strong structure. Push harder on measurable impact and close tighter.",
    meta: "81 / 100",
    tone: "feedback",
  },
] as const;

const FLOW_STEPS = [
  { icon: FileText, title: "Resume", caption: "Add context" },
  { icon: Mic, title: "Interview", caption: "Answer live" },
  { icon: Target, title: "Score", caption: "See pressure score" },
  { icon: TrendingUp, title: "Improve", caption: "Retry weak spots" },
];

const DASHBOARD_PREVIEW = [
  { label: "S1", score: 48 },
  { label: "S2", score: 58 },
  { label: "S3", score: 66 },
  { label: "S4", score: 73 },
  { label: "S5", score: 79 },
  { label: "S6", score: 84 },
];

const WEAK_AREAS = ["Communication", "Technical depth", "Confidence", "Story structure"];

const toneClass: Record<(typeof PREVIEW_STATES)[number]["tone"], string> = {
  question: "bg-rose-400",
  listening: "bg-accent",
  processing: "bg-amber-300",
  feedback: "bg-sky-300",
};

const SimulationPreview = memo(function SimulationPreview() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((value) => (value + 1) % PREVIEW_STATES.length);
    }, 2000);

    return () => window.clearInterval(interval);
  }, []);

  const state = PREVIEW_STATES[activeIndex];

  return (
    <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,24,38,0.98),rgba(8,11,20,0.95))] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.35)] sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-accent">Live system preview</p>
          <h2 className="mt-2 font-display text-3xl leading-none tracking-[0.05em] text-slate-50">Interview simulation</h2>
        </div>
        <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm uppercase tracking-[0.18em] text-slate-100">
          {state.meta}
        </div>
      </div>

      <div className="mt-6 rounded-[26px] border border-white/10 bg-white/[0.04] p-5">
        <div className="flex items-center gap-2">
          <div className={`h-2.5 w-2.5 rounded-full ${toneClass[state.tone]} ${state.tone !== "feedback" ? "animate-pulse" : ""}`} />
          <p className="text-sm uppercase tracking-[0.18em] text-slate-400">{state.label}</p>
        </div>
        <p className="mt-4 text-2xl leading-10 text-slate-50 sm:text-[2rem] sm:leading-[3rem]">{state.prompt}</p>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm uppercase tracking-[0.16em] text-slate-400">Mode</p>
          <p className="mt-3 text-lg text-slate-100">Timed</p>
        </div>
        <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm uppercase tracking-[0.16em] text-slate-400">Input</p>
          <p className="mt-3 text-lg text-slate-100">Voice</p>
        </div>
        <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm uppercase tracking-[0.16em] text-slate-400">Output</p>
          <p className="mt-3 text-lg text-slate-100">Score</p>
        </div>
      </div>
    </div>
  );
});

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-[#070b14] noise-overlay">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_top,_rgba(244,180,76,0.18),_transparent_38%),radial-gradient(circle_at_20%_20%,_rgba(0,255,136,0.12),_transparent_30%),radial-gradient(circle_at_80%_20%,_rgba(74,144,226,0.14),_transparent_30%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <section className="grid items-center gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-[0.28em] text-accent">Interview operating system</p>
            <h1 className="mt-4 font-display text-5xl leading-[0.92] tracking-[0.05em] text-slate-50 sm:text-6xl lg:text-7xl">
              Practice Real Interviews Under Pressure
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">Voice-based AI interviews with scoring and feedback.</p>

            <div className="mt-8">
              <Link
                to="/interview"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(90deg,#00ff88,#f4b44c)] px-6 py-4 text-base font-medium text-[#07110c] shadow-[0_20px_40px_rgba(0,255,136,0.18)] transition-transform duration-200 ease-in-out hover:scale-[1.02] sm:w-auto"
              >
                Start Interview
                <ArrowRight size={18} />
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-4">
              {FLOW_STEPS.map((step) => (
                <div
                  key={step.title}
                  className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4 transition-all duration-200 ease-in-out hover:-translate-y-1 hover:border-accent/20"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-accent">
                    <step.icon size={18} />
                  </div>
                  <p className="mt-4 text-lg text-slate-50">{step.title}</p>
                  <p className="mt-1 text-sm text-slate-400">{step.caption}</p>
                </div>
              ))}
            </div>
          </div>

          <SimulationPreview />
        </section>

        <section className="mt-10 rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,24,38,0.95),rgba(8,11,20,0.94))] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.32)] sm:p-6">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-accent" />
            <p className="text-sm uppercase tracking-[0.22em] text-slate-400">Dashboard preview</p>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
              <ScoreTrendChart data={DASHBOARD_PREVIEW} />
            </div>

            <div className="grid gap-4">
              <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Weak areas</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {WEAK_AREAS.map((area) => (
                    <span key={area} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-slate-100">
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  ["Sessions", "18"],
                  ["Avg", "74"],
                  ["Live", "6"],
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
