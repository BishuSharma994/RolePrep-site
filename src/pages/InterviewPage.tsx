import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, Briefcase, FileText, Loader2, Send, UserRound } from "lucide-react";
import AudioRecorder from "../components/AudioRecorder";
import UploadBox from "../components/UploadBox";
import TranscriptPanel from "../components/TranscriptPanel";
import AnalysisPanel from "../components/AnalysisPanel";
import { useStore } from "../store";
import { analyzeAudio, createSession, getOrCreateLocalUserId, getSessions, normalizeAnalysisResponse } from "../services/api";

const SAMPLE_QUESTIONS = [
  "Tell me about a time you led a project under pressure.",
  "What is your greatest professional weakness?",
  "Describe a conflict with a coworker and how you resolved it.",
  "Why do you want this role?",
  "Walk me through a difficult decision you made.",
];

function getInitialValue(key: string) {
  return window.localStorage.getItem(key) ?? "";
}

function getErrorMessage(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response
  ) {
    const data = error.response.data as { detail?: string | { reason?: string } };
    if (typeof data?.detail === "string") {
      return data.detail;
    }
    if (data?.detail && typeof data.detail === "object" && "reason" in data.detail) {
      return String(data.detail.reason ?? "Request failed.");
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

export default function InterviewPage() {
  const {
    transcript,
    analysis,
    currentSession,
    isAnalyzing,
    setTranscript,
    setAnalysis,
    setCurrentSession,
    setSessions,
    addSession,
    setIsAnalyzing,
  } = useStore();

  const [userId] = useState(() => getOrCreateLocalUserId());
  const [role, setRole] = useState(() => getInitialValue("roleprep_role"));
  const [jdText, setJdText] = useState(() => getInitialValue("roleprep_jd_text"));
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [question, setQuestion] = useState(SAMPLE_QUESTIONS[0]);
  const [inputMode, setInputMode] = useState<"record" | "upload">("record");
  const [error, setError] = useState("");

  useEffect(() => {
    const index = Math.floor(Math.random() * SAMPLE_QUESTIONS.length);
    setQuestion(SAMPLE_QUESTIONS[index]);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("roleprep_role", role);
  }, [role]);

  useEffect(() => {
    window.localStorage.setItem("roleprep_jd_text", jdText);
  }, [jdText]);

  useEffect(() => {
    let isMounted = true;

    const syncExistingSession = async () => {
      try {
        const sessions = await getSessions(userId);
        if (!isMounted) {
          return;
        }

        setSessions(sessions);
        if (sessions[0]) {
          setCurrentSession(sessions[0]);
        }
      } catch {
        // The page can still operate without preloading an existing session.
      }
    };

    syncExistingSession();

    return () => {
      isMounted = false;
    };
  }, [setCurrentSession, setSessions, userId]);

  useEffect(() => {
    if (currentSession?.currentQuestion) {
      setQuestion(currentSession.currentQuestion);
    }
  }, [currentSession?.currentQuestion]);

  const refreshSessions = async () => {
    const sessions = await getSessions(userId);
    setSessions(sessions);
    if (sessions[0]) {
      setCurrentSession(sessions[0]);
    }
  };

  const ensureSession = async () => {
    if (
      currentSession &&
      currentSession.userId === userId &&
      currentSession.role === role.trim() &&
      currentSession.jdText === jdText.trim()
    ) {
      return currentSession;
    }

    const session = await createSession({
      userId,
      role: role.trim(),
      jdText: jdText.trim(),
    });

    addSession(session);
    setCurrentSession(session);
    return session;
  };

  const handleRecordReady = (blob: Blob) => {
    setAudioBlob(blob);
    setError("");
  };

  const handleRecorderReset = () => {
    setAudioBlob(null);
  };

  const handleFileReady = (blob: Blob | null) => {
    setAudioBlob(blob);
    setError("");
  };

  const handleSubmit = async () => {
    if (!role.trim()) {
      setError("Enter the target role before starting analysis.");
      return;
    }

    if (!jdText.trim()) {
      setError("Paste the job description before starting analysis.");
      return;
    }

    if (!audioBlob) {
      setError("Please record or upload an audio response first.");
      return;
    }

    setError("");
    setIsAnalyzing(true);
    setTranscript("");
    setAnalysis(null);

    try {
      await ensureSession();

      const audioFile =
        audioBlob instanceof File
          ? audioBlob
          : new File([audioBlob], "interview-response.webm", {
              type: audioBlob.type || "audio/webm",
            });

      const response = await analyzeAudio(audioFile, {
        role: role.trim(),
        jdText: jdText.trim(),
        currentQuestion: question,
      });

      const normalized = normalizeAnalysisResponse(response);
      setTranscript(normalized.transcript);
      setAnalysis(normalized.analysis);
      if (normalized.analysis.followUp.question) {
        setQuestion(normalized.analysis.followUp.question);
      }

      await refreshSessions();
    } catch (submissionError) {
      setError(getErrorMessage(submissionError));
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-dvh bg-bg-base noise-overlay">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-accent/5 blur-[120px]" />
        <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-emerald-500/5 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl animate-fade-in px-4 py-6 sm:px-6">
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-white/8 bg-bg-overlay/80 p-5 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.3em] text-accent">RolePrep</p>
            <h1 className="mt-2 font-display text-4xl tracking-wider text-text-primary sm:text-5xl">Interview Studio</h1>
            <p className="mt-2 max-w-2xl text-sm font-body leading-relaxed text-text-secondary">
              Start a real backend session, analyze your spoken answer, and keep the dashboard synced with the live API.
            </p>
          </div>

          <div className="flex flex-col items-stretch gap-3 sm:items-end">
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-mono uppercase tracking-widest text-text-secondary">
              User ID: <span className="text-text-primary">{userId.slice(0, 8)}</span>
            </div>
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-accent/25 bg-accent/10 px-4 py-3 text-sm font-mono uppercase tracking-widest text-accent transition hover:bg-accent/15"
            >
              <BarChart3 size={16} />
              Dashboard
            </Link>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="card-base p-5">
            <div className="mb-4 flex items-center gap-2">
              <Briefcase size={14} className="text-text-secondary" />
              <h2 className="text-xs font-mono uppercase tracking-widest text-text-secondary">Session Setup</h2>
            </div>

            <div className="space-y-4">
              <label className="block space-y-2">
                <span className="text-xs font-mono uppercase tracking-widest text-text-secondary">Target Role</span>
                <div className="relative">
                  <UserRound size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
                  <input
                    type="text"
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                    placeholder="Backend Engineer, Product Manager, Designer..."
                    className="w-full rounded-xl border border-white/10 bg-white/4 py-3 pl-10 pr-4 text-sm font-body text-text-primary outline-none transition focus:border-accent/40 focus:bg-white/6"
                  />
                </div>
              </label>

              <label className="block space-y-2">
                <span className="text-xs font-mono uppercase tracking-widest text-text-secondary">Job Description</span>
                <div className="relative">
                  <FileText size={14} className="pointer-events-none absolute left-3 top-3.5 text-text-dim" />
                  <textarea
                    value={jdText}
                    onChange={(event) => setJdText(event.target.value)}
                    placeholder="Paste the job description or the most relevant responsibilities here."
                    rows={6}
                    className="w-full rounded-xl border border-white/10 bg-white/4 py-3 pl-10 pr-4 text-sm font-body leading-relaxed text-text-primary outline-none transition focus:border-accent/40 focus:bg-white/6"
                  />
                </div>
              </label>
            </div>
          </div>

          <div className="card-elevated border border-white/8 p-5">
            <p className="mb-2 text-xs font-mono uppercase tracking-widest text-text-secondary">Live Session</p>
            <p className="text-lg font-body font-medium leading-snug text-text-primary">
              {currentSession ? currentSession.role : "No backend session started yet"}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/4 p-4">
                <p className="text-xs font-mono uppercase tracking-widest text-text-secondary">Plan</p>
                <p className="mt-2 text-lg font-display tracking-wider text-text-primary">
                  {currentSession?.activeSessionPlan || currentSession?.selectedPlan || "N/A"}
                </p>
              </div>
              <div className="rounded-xl bg-white/4 p-4">
                <p className="text-xs font-mono uppercase tracking-widest text-text-secondary">Credits</p>
                <p className="mt-2 text-lg font-display tracking-wider text-text-primary">
                  {currentSession?.sessionCredits ?? 0}
                </p>
              </div>
              <div className="rounded-xl bg-white/4 p-4">
                <p className="text-xs font-mono uppercase tracking-widest text-text-secondary">Questions</p>
                <p className="mt-2 text-lg font-display tracking-wider text-text-primary">
                  {currentSession?.questionCount ?? 0}
                </p>
              </div>
              <div className="rounded-xl bg-white/4 p-4">
                <p className="text-xs font-mono uppercase tracking-widest text-text-secondary">Stage</p>
                <p className="mt-2 text-lg font-display tracking-wider text-text-primary">
                  {currentSession?.currentStage || "setup"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-white/8 p-5 card-elevated">
          <p className="mb-2 text-xs font-mono uppercase tracking-widest text-text-secondary">Interview Question</p>
          <p className="text-lg font-body font-medium leading-snug text-text-primary">{question}</p>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="flex w-fit items-center gap-1 rounded-lg bg-white/4 p-1">
              {(["record", "upload"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setInputMode(mode)}
                  className={`rounded-md px-4 py-1.5 text-xs font-mono capitalize transition-all duration-200 ${
                    inputMode === mode ? "bg-bg-card text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {inputMode === "record" ? (
              <AudioRecorder onAudioReady={handleRecordReady} onReset={handleRecorderReset} />
            ) : (
              <UploadBox onFileReady={handleFileReady} />
            )}

            {error && (
              <p className="rounded-lg border border-danger/15 bg-danger/8 px-3 py-2 text-xs font-mono text-danger">{error}</p>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isAnalyzing || !audioBlob}
              className={`flex w-full items-center justify-center gap-2.5 rounded-xl py-3.5 text-sm font-body font-medium transition-all duration-200 ${
                isAnalyzing || !audioBlob
                  ? "cursor-not-allowed bg-white/5 text-text-dim"
                  : "glow-accent-sm bg-accent text-bg-base hover:bg-accent-dim active:scale-[0.99]"
              }`}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Analyzing response...
                </>
              ) : (
                <>
                  <Send size={15} />
                  Start or Sync Session and Analyze
                </>
              )}
            </button>

            <div className="lg:hidden">
              <TranscriptPanel transcript={transcript} isLoading={isAnalyzing} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="hidden lg:block">
              <TranscriptPanel transcript={transcript} isLoading={isAnalyzing} />
            </div>
            <AnalysisPanel analysis={analysis} isLoading={isAnalyzing} />
          </div>
        </div>
      </div>
    </div>
  );
}
