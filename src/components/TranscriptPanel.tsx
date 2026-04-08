import { FileText } from "lucide-react";

interface Props {
  transcript: string;
  isLoading: boolean;
}

export default function TranscriptPanel({ transcript, isLoading }: Props) {
  return (
    <div className="card-base flex h-full min-h-[200px] flex-col p-5">
      <div className="mb-4 flex items-center gap-2">
        <FileText size={14} className="text-text-secondary" />
        <h3 className="text-xs font-mono uppercase tracking-widest text-text-secondary">Transcript</h3>
      </div>

      {isLoading && !transcript && (
        <div className="flex flex-1 flex-col justify-center gap-2">
          <div className="space-y-2">
            {[100, 85, 92, 70].map((width, index) => (
              <div
                key={index}
                className="h-3 animate-pulse rounded bg-white/6"
                style={{ width: `${width}%`, animationDelay: `${index * 0.1}s` }}
              />
            ))}
          </div>
          <p className="mt-3 text-xs font-mono text-text-dim">Transcribing audio...</p>
        </div>
      )}

      {!isLoading && !transcript && (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-center text-sm font-body text-text-dim">
            Transcript will appear here
            <br />
            after submission
          </p>
        </div>
      )}

      {transcript && (
        <div className="flex-1 overflow-y-auto">
          <p className="animate-fade-in text-sm font-body leading-relaxed text-text-primary">{transcript}</p>
        </div>
      )}
    </div>
  );
}
