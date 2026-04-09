import { FileText, Mic, Target, TrendingUp } from "lucide-react";

const FLOW_STEPS = [
  { icon: FileText, title: "Upload Resume", caption: "Load context" },
  { icon: Mic, title: "Start Interview", caption: "Answer live" },
  { icon: Target, title: "Get Score", caption: "See evaluation" },
  { icon: TrendingUp, title: "Improve", caption: "Retry weak spots" },
];

export default function FlowSection() {
  return (
    <section className="mt-10">
      <p className="text-sm uppercase tracking-[0.24em] text-slate-400">System flow</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {FLOW_STEPS.map((step) => (
          <div
            key={step.title}
            className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,24,38,0.95),rgba(8,11,20,0.92))] p-5 transition-all duration-200 ease-in-out hover:-translate-y-1 hover:border-accent/20"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-accent">
              <step.icon size={18} />
            </div>
            <p className="mt-4 text-xl text-slate-50">{step.title}</p>
            <p className="mt-1 text-sm text-slate-400">{step.caption}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
