import { useRef, useState, type DragEvent } from "react";
import { Upload, FileAudio, X } from "lucide-react";

interface Props {
  onFileReady: (blob: Blob | null) => void;
}

export default function UploadBox({ onFileReady }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (incomingFile: File) => {
    setFile(incomingFile);
    onFileReady(incomingFile);
  };

  const clearFile = () => {
    setFile(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    onFileReady(null);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith("audio/")) {
      handleFile(droppedFile);
    }
  };

  const formatSize = (bytes: number) =>
    bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

  return (
    <div>
      {!file ? (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`relative cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200 ${
            dragging
              ? "scale-[1.01] border-accent bg-accent/8"
              : "border-white/10 hover:border-white/20 hover:bg-white/2"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(event) => {
              const selectedFile = event.target.files?.[0];
              if (selectedFile) {
                handleFile(selectedFile);
              }
            }}
          />
          <div className="flex flex-col items-center gap-2">
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${dragging ? "bg-accent/20" : "bg-white/5"}`}>
              <Upload size={18} className={dragging ? "text-accent" : "text-text-secondary"} />
            </div>
            <div>
              <p className="text-sm font-body text-text-secondary">
                Drop audio file or <span className="text-accent underline underline-offset-2">browse</span>
              </p>
              <p className="mt-0.5 text-xs font-mono text-text-dim">MP3, WAV, M4A, WEBM</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-accent/20 bg-accent/8 px-4 py-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/15">
            <FileAudio size={16} className="text-accent" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-body text-text-primary">{file.name}</p>
            <p className="text-xs font-mono text-text-secondary">{formatSize(file.size)}</p>
          </div>
          <button
            type="button"
            onClick={clearFile}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-white/8 transition-colors hover:bg-white/15"
          >
            <X size={12} className="text-text-secondary" />
          </button>
        </div>
      )}
    </div>
  );
}
