import { FileText, Loader2 } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  question: string;
  statusText: string;
  stageText: string;
  answeredCount: number;
  questionNumber: number;
  totalQuestions: number;
  isProcessing: boolean;
  isLocked: boolean;
  isListening: boolean;
  isUrgent: boolean;
  error: string;
  notice: string;
  onUploadClick: () => void;
  children?: ReactNode;
}

export default function InterviewLayout({
  question,
  statusText,
  stageText,
  answeredCount,
  questionNumber,
  totalQuestions,
  isProcessing,
  isLocked,
  isListening,
  isUrgent,
  error,
  notice,
  onUploadClick,
  children,
}: Props) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,24,38,0.97),rgba(8,11,20,0.95))] p-4 shadow-[0_30px_80px_rgba(0,0,0,0.35)] sm:rounded-[32px] sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-accent">Live simulation</p>
          <h2 className="mt-3 font-display text-3xl leading-[0.95] tracking-[0.05em] text-slate-50 sm:text-5xl">Timed interview round</h2>
        </div>

        <button
          type="button"
          onClick={onUploadClick}
          disabled={isProcessing}
          className="inline-flex items-center justify-center gap-2 self-start rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-200 transition-all duration-200 ease-in-out hover:border-white/20 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FileText size={16} />
          Upload audio
        </button>
      </div>

      <div className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.03] p-4 text-center sm:mt-6 sm:rounded-[28px] sm:p-8">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Current question</p>
          <div className={`rounded-full border px-4 py-2 text-sm uppercase tracking-[0.18em] ${isUrgent ? "border-rose-400/25 bg-rose-400/10 text-rose-200" : "border-white/10 bg-white/[0.04] text-slate-200"}`}>
            Question {questionNumber} of {totalQuestions}
          </div>
        </div>
        <p className="mt-4 text-2xl leading-9 text-slate-50 sm:mt-5 sm:text-4xl sm:leading-[3.6rem]">{question}</p>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Status</p>
          <div className="mt-3 flex items-center gap-3">
            <span className={`h-3 w-3 rounded-full ${isProcessing ? "animate-pulse bg-amber-300" : isListening ? "animate-pulse bg-accent" : isUrgent ? "bg-rose-400" : "bg-slate-500"}`} />
            <p className="text-lg text-slate-100">{statusText}</p>
          </div>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Current stage</p>
          <p className="mt-3 text-lg text-slate-100">{stageText}</p>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Questions answered</p>
          <p className="mt-3 text-lg text-slate-100">{answeredCount}</p>
        </div>
      </div>

      {isProcessing && (
        <div className="mt-5 flex items-center gap-3 rounded-[24px] border border-amber-300/20 bg-amber-300/10 px-4 py-4 text-base text-slate-100">
          <Loader2 size={18} className="animate-spin text-accent" />
          Analyzing response...
        </div>
      )}

      {error && <div className="mt-5 rounded-[24px] border border-rose-400/20 bg-rose-400/10 px-4 py-4 text-base text-rose-200">{error}</div>}
      {notice && <div className="mt-5 rounded-[24px] border border-accent/20 bg-accent/10 px-4 py-4 text-base text-emerald-200">{notice}</div>}

      {children}
    </div>
  );
}
