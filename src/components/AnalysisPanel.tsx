import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle, Zap, Activity, Clock, MessageSquare, ChevronRight } from "lucide-react";
import type { AnalysisResult } from "../store";
import ScoreCard from "./ScoreCard";

interface Props {
  analysis: AnalysisResult | null;
  isLoading: boolean;
}

function Pill({ color, children }: { color: "red" | "yellow" | "green"; children: ReactNode }) {
  const className = {
    red: "border-danger/20 bg-danger/10 text-danger",
    yellow: "border-warn/20 bg-warn/10 text-warn",
    green: "border-accent/20 bg-accent/10 text-accent",
  }[color];

  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-mono ${className}`}>
      {children}
    </span>
  );
}

function MetricBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-text-secondary">{label}</span>
        <span className="text-xs font-mono text-text-primary">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/6">
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card-base animate-pulse space-y-3 p-4">
      <div className="h-3 w-24 rounded bg-white/6" />
      <div className="space-y-2">
        <div className="h-2.5 w-full rounded bg-white/5" />
        <div className="h-2.5 w-4/5 rounded bg-white/5" />
        <div className="h-2.5 w-3/5 rounded bg-white/5" />
      </div>
    </div>
  );
}

export default function AnalysisPanel({ analysis, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="animate-fade-in space-y-3">
        <div className="mb-4 flex items-center gap-2">
          <div className="h-4 w-1.5 rounded-full bg-accent/40" />
          <h2 className="text-xs font-mono uppercase tracking-widest text-text-secondary">Analyzing...</h2>
        </div>
        {[1, 2, 3].map((item) => (
          <SkeletonCard key={item} />
        ))}
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="flex min-h-[300px] h-full flex-col items-center justify-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/4">
          <Activity size={20} className="text-text-dim" />
        </div>
        <p className="text-sm font-body text-text-dim">
          Analysis results will
          <br />
          appear after submission
        </p>
      </div>
    );
  }

  const { content, voice, followUp } = analysis;

  return (
    <div className="animate-slide-up space-y-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-4 w-1.5 rounded-full bg-accent" />
          <h2 className="text-xs font-mono uppercase tracking-widest text-text-secondary">Analysis</h2>
        </div>
        <ScoreCard score={analysis.score} size="sm" />
      </div>

      <div className="card-base space-y-3 p-4">
        <div className="flex items-center gap-2">
          <MessageSquare size={13} className="text-text-secondary" />
          <h3 className="text-xs font-mono uppercase tracking-widest text-text-secondary">Content</h3>
        </div>

        {content.issues.length > 0 && (
          <div className="space-y-1.5">
            {content.issues.map((issue, index) => (
              <div key={index} className="flex items-start gap-2">
                <AlertTriangle size={12} className="mt-0.5 shrink-0 text-danger" />
                <p className="text-xs font-body text-text-secondary">{issue}</p>
              </div>
            ))}
          </div>
        )}

        {content.strengths.length > 0 && (
          <div className="space-y-1.5 border-t border-white/5 pt-1">
            {content.strengths.map((strength, index) => (
              <div key={index} className="flex items-start gap-2">
                <CheckCircle size={12} className="mt-0.5 shrink-0 text-accent" />
                <p className="text-xs font-body text-text-secondary">{strength}</p>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2 border-t border-white/5 pt-1">
          <MetricBar label="Clarity" value={content.clarity} color="#00ff88" />
          <MetricBar label="Relevance" value={content.relevance} color="#ffaa00" />
        </div>
      </div>

      <div className="card-base space-y-3 p-4">
        <div className="flex items-center gap-2">
          <Activity size={13} className="text-text-secondary" />
          <h3 className="text-xs font-mono uppercase tracking-widest text-text-secondary">Voice & Delivery</h3>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-white/3 p-2.5 text-center">
            <div className="mb-1 flex items-center justify-center gap-1">
              <Zap size={11} className="text-warn" />
              <span className="text-xs font-mono text-text-dim">Fillers</span>
            </div>
            <p className="font-display text-xl text-warn">{voice.fillerCount}</p>
          </div>
          <div className="rounded-lg bg-white/3 p-2.5 text-center">
            <div className="mb-1 flex items-center justify-center gap-1">
              <Activity size={11} className="text-accent" />
              <span className="text-xs font-mono text-text-dim">WPM</span>
            </div>
            <p className="font-display text-xl text-text-primary">{voice.speechRate}</p>
          </div>
          <div className="rounded-lg bg-white/3 p-2.5 text-center">
            <div className="mb-1 flex items-center justify-center gap-1">
              <Clock size={11} className="text-text-secondary" />
              <span className="text-xs font-mono text-text-dim">Pauses</span>
            </div>
            <p className="font-display text-xl text-text-primary">{voice.pauses}</p>
          </div>
        </div>

        {voice.fillers.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {voice.fillers.map((filler, index) => (
              <Pill key={index} color="yellow">
                "{filler}"
              </Pill>
            ))}
          </div>
        )}

        <MetricBar label="Confidence" value={voice.confidence} color="#00ff88" />
      </div>

      <div className="card-elevated border-accent-glow space-y-2 p-4">
        <div className="flex items-center gap-2">
          <ChevronRight size={13} className="text-accent" />
          <h3 className="text-xs font-mono uppercase tracking-widest text-accent">Follow-up Question</h3>
        </div>
        <p className="text-sm font-body leading-relaxed text-text-primary">{followUp.question}</p>
        <p className="border-l-2 border-accent/30 pl-3 text-xs font-body italic text-text-secondary">{followUp.hint}</p>
      </div>
    </div>
  );
}
