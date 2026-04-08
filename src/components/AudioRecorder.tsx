import { useEffect } from "react";
import { Mic, MicOff, Square, RotateCcw } from "lucide-react";
import { useAudioRecorder } from "../hooks/useAudioRecorder";

interface Props {
  onAudioReady: (blob: Blob, duration: number) => void;
  onReset?: () => void;
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function WaveformBars() {
  return (
    <div className="flex h-6 items-center gap-[3px]">
      {Array.from({ length: 7 }).map((_, index) => (
        <span key={index} className="waveform-bar" style={{ height: `${12 + (index % 3) * 8}px` }} />
      ))}
    </div>
  );
}

export default function AudioRecorder({ onAudioReady, onReset }: Props) {
  const { state, audioBlob, duration, errorMsg, start, stop, reset } = useAudioRecorder();

  useEffect(() => {
    if (state === "stopped" && audioBlob) {
      onAudioReady(audioBlob, duration);
    }
  }, [audioBlob, duration, onAudioReady, state]);

  const handleReset = () => {
    reset();
    onReset?.();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        {state === "idle" && (
          <button
            type="button"
            onClick={start}
            className="group relative flex w-full items-center gap-3 rounded-xl border border-accent/25 bg-accent/10 px-6 py-4 transition-all duration-200 hover:border-accent/40 hover:bg-accent/15"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20 transition-colors group-hover:bg-accent/30">
              <Mic size={18} className="text-accent" />
            </div>
            <div className="text-left">
              <div className="text-sm font-body font-medium text-text-primary">Start Recording</div>
              <div className="text-xs font-mono text-text-secondary">Click to begin</div>
            </div>
            <div className="ml-auto h-2 w-2 rounded-full bg-accent animate-pulse" />
          </button>
        )}

        {state === "requesting" && (
          <div className="card-base flex w-full items-center gap-3 rounded-xl px-6 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warn/10">
              <MicOff size={18} className="text-warn" />
            </div>
            <div className="text-sm font-body text-warn">Requesting microphone access...</div>
          </div>
        )}

        {state === "recording" && (
          <div className="flex w-full items-center gap-4 rounded-xl border border-danger/20 bg-danger/8 px-6 py-4">
            <div className="relative flex h-10 w-10 items-center justify-center">
              <span className="absolute h-10 w-10 rounded-full bg-danger/20 animate-ping" />
              <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-danger/20">
                <div className="h-3 w-3 rounded-full bg-danger" />
              </div>
            </div>

            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-xs font-mono font-medium uppercase tracking-widest text-danger">Recording</span>
                <WaveformBars />
              </div>
              <div className="font-mono text-2xl tabular-nums text-text-primary">{formatDuration(duration)}</div>
            </div>

            <button
              type="button"
              onClick={stop}
              className="flex items-center gap-2 rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500"
            >
              <Square size={13} fill="white" />
              Stop
            </button>
          </div>
        )}

        {state === "stopped" && (
          <div className="flex w-full items-center gap-3 rounded-xl border border-accent/20 bg-accent/8 px-6 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15">
              <Mic size={18} className="text-accent" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-body font-medium text-text-primary">Recording ready</div>
              <div className="text-xs font-mono text-text-secondary">{formatDuration(duration)}</div>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 rounded-lg border border-white/8 px-3 py-1.5 text-xs text-text-secondary transition-all hover:border-white/15 hover:text-text-primary"
            >
              <RotateCcw size={12} />
              Re-record
            </button>
          </div>
        )}

        {state === "error" && (
          <div className="flex w-full items-center gap-3 rounded-xl border border-danger/20 bg-danger/8 px-6 py-4">
            <MicOff size={18} className="shrink-0 text-danger" />
            <p className="text-sm text-danger">{errorMsg}</p>
          </div>
        )}
      </div>
    </div>
  );
}
