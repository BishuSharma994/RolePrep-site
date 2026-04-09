import { useEffect, useState } from "react";
import { Mic, TimerReset } from "lucide-react";

const PREVIEW_STATES = [
  {
    label: "Question live",
    timer: "00:45",
    title: "Tell me about a time you had to recover a project that was already slipping.",
    bullets: [],
    tone: "question",
  },
  {
    label: "Listening",
    timer: "Mic active",
    title: "Response capture in progress",
    bullets: ["Voice pressure on", "Answer being recorded"],
    tone: "listening",
  },
  {
    label: "Processing",
    timer: "Analyzing...",
    title: "Analyzing response...",
    bullets: ["Scoring structure", "Checking delivery"],
    tone: "processing",
  },
  {
    label: "Feedback",
    timer: "78 / 100",
    title: "Answer evaluated",
    bullets: ["Strong structure under pressure", "Need sharper proof points"],
    tone: "feedback",
  },
] as const;

function toneDot(tone: (typeof PREVIEW_STATES)[number]["tone"]) {
  if (tone === "question") return "bg-rose-400";
  if (tone === "listening") return "bg-accent";
  if (tone === "processing") return "bg-amber-300";
  return "bg-sky-300";
}

export default function SimulationPreview() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(45);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((value) => (value + 1) % PREVIEW_STATES.length);
    }, 2000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (PREVIEW_STATES[activeIndex].tone !== "question") {
      return;
    }

    const timer = window.setInterval(() => {
      setSecondsLeft((value) => (value <= 5 ? 45 : value - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [activeIndex]);

  const state = PREVIEW_STATES[activeIndex];
  const listening = state.tone === "listening";
  const timerText =
    state.tone === "question"
      ? `00:${String(secondsLeft).padStart(2, "0")}`
      : state.timer;

  return (
    <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,24,38,0.98),rgba(8,11,20,0.95))] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.35)] sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className={`h-2.5 w-2.5 rounded-full ${toneDot(state.tone)} ${state.tone !== "feedback" ? "animate-pulse" : ""}`} />
          <p className="text-sm uppercase tracking-[0.22em] text-slate-300">{state.label}</p>
        </div>
        <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm uppercase tracking-[0.18em] text-slate-100">
          {timerText}
        </div>
      </div>

      <div className="mt-5 rounded-[26px] border border-white/10 bg-white/[0.04] p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-sm text-slate-200">
            <TimerReset size={15} />
            Timed round
          </div>
          <div className={`flex h-11 w-11 items-center justify-center rounded-full border ${listening ? "border-accent/30 bg-accent/12 shadow-[0_0_0_10px_rgba(0,255,136,0.08)]" : "border-white/10 bg-white/[0.04]"}`}>
            <Mic size={18} className={listening ? "animate-pulse text-accent" : "text-slate-300"} />
          </div>
        </div>

        <p className="text-2xl leading-10 text-slate-50 sm:text-[2rem] sm:leading-[3rem]">{state.title}</p>

        {state.bullets.length > 0 && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {state.bullets.map((bullet) => (
              <div key={bullet} className="rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200">
                {bullet}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
