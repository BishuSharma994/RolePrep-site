import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import DashboardPreview from "../components/DashboardPreview";
import FlowSection from "../components/FlowSection";
import SimulationPreview from "../components/SimulationPreview";
import SupportFooter from "../components/SupportFooter";
import { useStartInterviewAction } from "../hooks/useStartInterviewAction";

export default function LandingPage() {
  const startInterview = useStartInterviewAction();

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
              <button
                type="button"
                onClick={startInterview}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(90deg,#00ff88,#f4b44c)] px-6 py-4 text-base font-medium text-[#07110c] shadow-[0_20px_40px_rgba(0,255,136,0.18)] transition-transform duration-200 ease-in-out hover:scale-[1.02]"
              >
                Start Interview
                <ArrowRight size={18} />
              </button>
            </div>
          </div>

          <SimulationPreview />
        </section>

        <FlowSection />

        <div className="mt-8">
          <button
            type="button"
            onClick={startInterview}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(90deg,#00ff88,#f4b44c)] px-6 py-4 text-base font-medium text-[#07110c] shadow-[0_20px_40px_rgba(0,255,136,0.18)] transition-transform duration-200 ease-in-out hover:scale-[1.02]"
          >
            Start Interview
            <ArrowRight size={18} />
          </button>
        </div>

        <DashboardPreview />

        <div className="mt-8">
          <button
            type="button"
            onClick={startInterview}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(90deg,#00ff88,#f4b44c)] px-6 py-4 text-base font-medium text-[#07110c] shadow-[0_20px_40px_rgba(0,255,136,0.18)] transition-transform duration-200 ease-in-out hover:scale-[1.02]"
          >
            Start Interview
            <ArrowRight size={18} />
          </button>
        </div>

        <SupportFooter className="mt-10" />
      </div>
    </div>
  );
}
