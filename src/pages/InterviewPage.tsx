import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  Check,
  CreditCard,
  Crown,
  FileText,
  Layers3,
  Loader2,
  Paperclip,
  Send,
  Sparkles,
  Target,
  UploadCloud,
  UserRound,
  X,
} from "lucide-react";
import AudioRecorder from "../components/AudioRecorder";
import UploadBox from "../components/UploadBox";
import TranscriptPanel from "../components/TranscriptPanel";
import AnalysisPanel from "../components/AnalysisPanel";
import { useDeviceProfile } from "../hooks/useDeviceProfile";
import { type Session, useStore } from "../store";
import {
  analyzeAudio,
  createPaymentLink,
  createSession,
  getOrCreateLocalUserId,
  getSessions,
  normalizeAnalysisResponse,
  type PlanType,
} from "../services/api";

const SAMPLE_QUESTIONS = [
  "Tell me about a time you led a project under pressure.",
  "What is your greatest professional weakness?",
  "Describe a conflict with a coworker and how you resolved it.",
  "Why do you want this role?",
  "Walk me through a difficult decision you made.",
];

const STAGE_ORDER = ["setup", "resume_session", "warmup", "core", "followup", "complete"];
const PLAN_OPTIONS: Array<{
  planType: PlanType;
  label: string;
  price: string;
  description: string;
}> = [
  {
    planType: "session_10",
    label: "Single Session",
    price: "Rs 10",
    description: "Unlock one guided interview session and test the credit flow.",
  },
  {
    planType: "session_29",
    label: "Session Pack",
    price: "Rs 29",
    description: "Best for testing session credits and repeated practice rounds.",
  },
  {
    planType: "premium",
    label: "Premium",
    price: "Rs 99",
    description: "Unlock the premium plan path and subscription-style access.",
  },
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

function formatStageLabel(stage: string) {
  if (!stage) {
    return "Setup";
  }

  return stage
    .replace(/_/g, " ")
    .replace(/\b\w/g, (value) => value.toUpperCase());
}

function formatPlanLabel(plan: string) {
  if (!plan) {
    return "Free";
  }

  if (plan === "session_10") {
    return "Session 10";
  }

  if (plan === "session_29") {
    return "Session 29";
  }

  return plan.replace(/_/g, " ").replace(/\b\w/g, (value) => value.toUpperCase());
}

function formatExpiry(value: number) {
  if (!value) {
    return "Not active";
  }

  const timestamp = value > 10_000_000_000 ? value : value * 1000;
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStageIndex(stage: string, questionCount: number) {
  const exactMatch = STAGE_ORDER.findIndex((entry) => entry === stage);
  if (exactMatch >= 0) {
    return exactMatch;
  }

  if (questionCount >= 6) return 5;
  if (questionCount >= 4) return 4;
  if (questionCount >= 2) return 3;
  if (questionCount >= 1) return 2;
  return 0;
}

function getSessionProgress(session: Session | null, hasAnalysis: boolean) {
  if (!session) {
    return 8;
  }

  const stageIndex = getStageIndex(session.currentStage, session.questionCount);
  const stageProgress = ((stageIndex + 1) / STAGE_ORDER.length) * 100;
  const questionProgress = Math.min(100, session.questionCount * 18);
  const analysisProgress = hasAnalysis ? 72 : 0;

  return Math.max(12, Math.min(100, Math.round(Math.max(stageProgress, questionProgress, analysisProgress))));
}

function getPlanAccent(plan: string) {
  const normalized = plan.toLowerCase();

  if (normalized.includes("premium")) {
    return "border-amber-400/30 bg-amber-400/10 text-amber-200";
  }

  if (normalized.includes("session")) {
    return "border-sky-400/30 bg-sky-400/10 text-sky-200";
  }

  return "border-white/10 bg-white/5 text-text-secondary";
}

function getStageTone(isActive: boolean, isComplete: boolean) {
  if (isActive) {
    return "border-accent/40 bg-accent/12 text-accent shadow-[0_0_0_1px_rgba(0,255,136,0.1)]";
  }

  if (isComplete) {
    return "border-white/12 bg-white/6 text-text-primary";
  }

  return "border-white/8 bg-white/[0.03] text-text-dim";
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
  const device = useDeviceProfile();

  const [userId] = useState(() => getOrCreateLocalUserId());
  const [role, setRole] = useState(() => getInitialValue("roleprep_role"));
  const [jdText, setJdText] = useState(() => getInitialValue("roleprep_jd_text"));
  const [resumeNotes, setResumeNotes] = useState(() => getInitialValue("roleprep_resume_notes"));
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeExcerpt, setResumeExcerpt] = useState("");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [question, setQuestion] = useState(SAMPLE_QUESTIONS[0]);
  const [inputMode, setInputMode] = useState<"record" | "upload">("record");
  const [error, setError] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [isRefreshingSession, setIsRefreshingSession] = useState(false);
  const [activeCheckoutPlan, setActiveCheckoutPlan] = useState<PlanType | null>(null);
  const [sessionContextKey, setSessionContextKey] = useState("");

  const currentPlan = currentSession?.activeSessionPlan || currentSession?.selectedPlan || "free";
  const isCompactLayout = device.isMobile || device.isStandalone;
  const heroTitle = isCompactLayout ? "Interview Studio" : "Premium Interview Studio";
  const heroCopy = isCompactLayout
    ? "A cleaner mobile command center for live practice, billing, and stage-aware feedback."
    : "Build a sharper answer flow with a cleaner command center, a visible stage ladder, and live plan status while every answer syncs into your backend session.";
  const sessionIdentityCopy = isCompactLayout
    ? "This device is mapped to your backend user."
    : "Private browser ID connected to your live backend user.";
  const billingCopy = isCompactLayout
    ? "Start payment, return here, then refresh to pull credits and plan state."
    : "Start a Razorpay checkout and then refresh this session after payment.";
  const sessionProgress = useMemo(
    () => getSessionProgress(currentSession, Boolean(analysis)),
    [analysis, currentSession],
  );
  const currentStageIndex = getStageIndex(currentSession?.currentStage || "", currentSession?.questionCount ?? 0);
  const fieldClassName =
    "w-full rounded-2xl border border-white/10 bg-[#0f1420] px-4 py-3 text-sm font-body text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-accent/50 focus:bg-[#121826] focus:ring-2 focus:ring-accent/10";

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
    window.localStorage.setItem("roleprep_resume_notes", resumeNotes);
  }, [resumeNotes]);

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
          setSessionContextKey(`${sessions[0].role.trim()}::${sessions[0].jdText.trim()}`);
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
      setSessionContextKey(`${sessions[0].role.trim()}::${sessions[0].jdText.trim()}`);
    }
  };

  const handleRefreshSession = async () => {
    setPaymentError("");
    setIsRefreshingSession(true);

    try {
      await refreshSessions();
    } catch (refreshError) {
      setPaymentError(getErrorMessage(refreshError));
    } finally {
      setIsRefreshingSession(false);
    }
  };

  const ensureSession = async () => {
    const currentContextKey = `${role.trim()}::${jdText.trim()}`;
    if (
      currentSession &&
      currentSession.userId === userId &&
      currentContextKey === sessionContextKey
    ) {
      return currentSession;
    }

    const session = await createSession({
      userId,
      role: role.trim(),
      jdText: jdText.trim(),
      parserData: {
        candidate_profile: {
          resume_file_name: resumeFile?.name ?? null,
          resume_notes: resumeNotes.trim() || null,
          resume_text_excerpt: resumeExcerpt || null,
        },
      },
      resumePath: resumeFile?.name,
    });

    addSession(session);
    setCurrentSession(session);
    setSessionContextKey(currentContextKey);
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

  const handleResumeFileChange = async (nextFile: File | null) => {
    setResumeFile(nextFile);

    if (!nextFile) {
      setResumeExcerpt("");
      return;
    }

    if (nextFile.type.startsWith("text/")) {
      const text = await nextFile.text();
      setResumeExcerpt(text.slice(0, 4000));
      return;
    }

    setResumeExcerpt("");
  };

  const handleCheckout = async (planType: PlanType) => {
    setPaymentError("");
    setActiveCheckoutPlan(planType);

    try {
      const { paymentLink } = await createPaymentLink(userId, planType);

      if (!paymentLink) {
        throw new Error("Payment link was not returned by the backend.");
      }

      window.location.href = paymentLink;
    } catch (checkoutError) {
      setPaymentError(getErrorMessage(checkoutError));
    } finally {
      setActiveCheckoutPlan(null);
    }
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
    <div className="min-h-dvh bg-[#070b14] noise-overlay">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_top,_rgba(244,180,76,0.18),_transparent_38%),radial-gradient(circle_at_20%_30%,_rgba(0,255,136,0.18),_transparent_30%),radial-gradient(circle_at_80%_25%,_rgba(74,144,226,0.12),_transparent_28%)]" />
        <div className="absolute -left-32 top-24 h-80 w-80 rounded-full bg-accent/10 blur-[120px]" />
        <div className="absolute right-0 top-20 h-96 w-96 rounded-full bg-amber-400/10 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl animate-fade-in px-4 py-5 sm:px-6 sm:py-6">
        <div className="mb-5 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(135deg,rgba(18,24,38,0.95),rgba(8,11,20,0.92))] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.35)] sm:rounded-[28px] sm:p-6">
            <div className="mb-7 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-mono uppercase tracking-[0.35em] text-accent">RolePrep</p>
                <h1 className="mt-3 font-display text-4xl leading-[0.92] tracking-[0.05em] text-slate-50 sm:text-5xl sm:tracking-[0.08em] lg:text-6xl">
                  {heroTitle}
                </h1>
              </div>

              <div className={`w-fit rounded-full border px-3 py-1 text-[11px] font-mono uppercase tracking-[0.2em] sm:text-xs sm:tracking-[0.25em] ${getPlanAccent(currentPlan)}`}>
                {formatPlanLabel(currentPlan)}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr] sm:gap-5">
              <div>
                <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">{heroCopy}</p>

                <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-6 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-xs font-mono uppercase tracking-[0.22em] text-slate-400">Current Stage</p>
                    <p className="mt-2 text-lg font-display tracking-[0.06em] text-slate-100 sm:mt-3 sm:text-xl sm:tracking-[0.08em]">
                      {formatStageLabel(currentSession?.currentStage || "setup")}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-xs font-mono uppercase tracking-[0.22em] text-slate-400">Progress</p>
                    <p className="mt-2 text-lg font-display tracking-[0.06em] text-slate-100 sm:mt-3 sm:text-xl sm:tracking-[0.08em]">{sessionProgress}%</p>
                  </div>
                  <div className="col-span-2 rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:col-span-1">
                    <p className="text-xs font-mono uppercase tracking-[0.22em] text-slate-400">Questions</p>
                    <p className="mt-2 text-lg font-display tracking-[0.06em] text-slate-100 sm:mt-3 sm:text-xl sm:tracking-[0.08em]">
                      {currentSession?.questionCount ?? 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[22px] border border-white/10 bg-black/20 p-4 backdrop-blur-xl sm:rounded-[24px] sm:p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-mono uppercase tracking-[0.22em] text-slate-400">Session Identity</p>
                    <p className="mt-2 text-xs leading-6 text-slate-300 sm:text-sm">{sessionIdentityCopy}</p>
                  </div>
                  <Sparkles size={18} className="text-amber-300" />
                </div>

                <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3 font-mono text-xs tracking-[0.18em] text-slate-100 sm:text-sm">
                  {userId.slice(0, 8)}...{userId.slice(-4)}
                </div>

                <div className="mt-4 flex flex-col gap-3">
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3 text-xs font-mono uppercase tracking-[0.2em] text-[#07110c] transition hover:bg-accent-dim sm:text-sm"
                  >
                    <BarChart3 size={16} />
                    Open Dashboard
                  </Link>
                  <p className="text-xs leading-6 text-slate-400">
                    Billing state, stage progress, and question history all reflect the live session record the backend returns for this user.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,21,34,0.95),rgba(8,11,20,0.94))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.32)] sm:rounded-[28px] sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-mono uppercase tracking-[0.25em] text-slate-400">Access & Billing</p>
                <h2 className="mt-2 font-display text-2xl tracking-[0.06em] text-slate-50 sm:text-3xl sm:tracking-[0.08em]">Plan Command</h2>
              </div>
              <Crown size={20} className="text-amber-300" />
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-amber-400/20 bg-amber-400/8 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-mono uppercase tracking-[0.22em] text-amber-200">Selected Plan</p>
                  <CreditCard size={15} className="text-amber-200" />
                </div>
                <p className="mt-3 text-xl font-display tracking-[0.06em] text-slate-50 sm:text-2xl sm:tracking-[0.08em]">{formatPlanLabel(currentPlan)}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Credits: <span className="text-slate-100">{currentSession?.sessionCredits ?? 0}</span>
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-mono uppercase tracking-[0.22em] text-slate-400">Upgrade Options</p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">{billingCopy}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleRefreshSession()}
                    disabled={isRefreshingSession}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] font-mono uppercase tracking-[0.18em] text-slate-200 transition hover:border-white/20 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isRefreshingSession ? "Refreshing" : "Refresh"}
                  </button>
                </div>

                <div className="grid gap-3">
                  {PLAN_OPTIONS.map((plan) => (
                    <div key={plan.planType} className="rounded-2xl border border-white/10 bg-[#0d1320] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-slate-100">{plan.label}</p>
                          <p className="mt-1 text-xs font-mono uppercase tracking-[0.16em] text-accent">{plan.price}</p>
                        </div>
                        {currentPlan === plan.planType && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-accent/25 bg-accent/10 px-2 py-1 text-[10px] font-mono uppercase tracking-[0.16em] text-accent">
                            <Check size={12} />
                            Active
                          </span>
                        )}
                      </div>
                      <p className="mt-3 text-xs leading-6 text-slate-400">{plan.description}</p>
                      <button
                        type="button"
                        onClick={() => void handleCheckout(plan.planType)}
                        disabled={activeCheckoutPlan !== null}
                        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(90deg,#00ff88,#f4b44c)] px-4 py-3 text-xs font-mono uppercase tracking-[0.18em] text-[#07110c] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {activeCheckoutPlan === plan.planType ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            Opening
                          </>
                        ) : (
                          <>
                            Pay & Activate
                            <ArrowRight size={14} />
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>

                {paymentError && (
                  <p className="mt-3 rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-rose-200">
                    {paymentError}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs font-mono uppercase tracking-[0.18em] text-slate-400">Expiry</p>
                  <p className="mt-3 text-sm leading-6 text-slate-100">
                    {formatExpiry(currentSession?.subscriptionExpiry ?? 0)}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs font-mono uppercase tracking-[0.18em] text-slate-400">Session State</p>
                  <p className="mt-3 text-sm leading-6 text-slate-100">
                    {currentSession?.activeSession ? "Active" : "Ready to start"}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-xs font-mono uppercase tracking-[0.22em] text-slate-400">Stage Ladder</p>
                  <span className="text-xs font-mono uppercase tracking-[0.18em] text-accent">{sessionProgress}% complete</span>
                </div>
                <div className="mb-4 h-2 overflow-hidden rounded-full bg-white/6">
                  <div className="h-full rounded-full bg-[linear-gradient(90deg,#00ff88,#f4b44c)]" style={{ width: `${sessionProgress}%` }} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {STAGE_ORDER.map((stage, index) => (
                    <div
                      key={stage}
                      className={`rounded-2xl border px-3 py-3 text-xs font-mono uppercase tracking-[0.16em] ${getStageTone(
                        index === currentStageIndex,
                        index < currentStageIndex,
                      )}`}
                    >
                      {formatStageLabel(stage)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`mb-5 grid gap-4 sm:gap-5 ${isCompactLayout ? "" : "lg:grid-cols-[1.1fr_0.9fr]"}`}>
          <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,20,32,0.95),rgba(8,11,20,0.94))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.3)] sm:rounded-[28px] sm:p-6">
            <div className="mb-5 flex items-center gap-2">
              <Briefcase size={15} className="text-slate-300" />
              <h2 className="text-xs font-mono uppercase tracking-[0.24em] text-slate-400">Session Setup</h2>
            </div>

            <div className="grid gap-4">
              <label className="block space-y-2">
                <span className="text-xs font-mono uppercase tracking-[0.18em] text-slate-400">Target Role</span>
                <div className="relative">
                  <UserRound size={14} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                    placeholder="Senior Product Designer, Growth PM, Staff Engineer..."
                    className={`${fieldClassName} pl-11`}
                  />
                </div>
              </label>

              <label className="block space-y-2">
                <span className="text-xs font-mono uppercase tracking-[0.18em] text-slate-400">Job Description</span>
                <div className="relative">
                  <FileText size={14} className="pointer-events-none absolute left-4 top-4 text-slate-500" />
                  <textarea
                    value={jdText}
                    onChange={(event) => setJdText(event.target.value)}
                    placeholder="Paste the JD so RolePrep can anchor the interview and scoring to the actual role."
                    rows={7}
                    className={`${fieldClassName} min-h-[180px] pl-11`}
                  />
                </div>
              </label>

              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4 sm:rounded-[24px]">
                <div className="mb-3 flex items-center gap-2">
                  <Paperclip size={14} className="text-slate-300" />
                  <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-slate-400">Your Resume</h3>
                </div>

                <label className="block cursor-pointer rounded-2xl border border-dashed border-white/12 bg-[#0d1320] px-4 py-4 transition hover:border-accent/30 hover:bg-[#11182a]">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.md"
                    className="hidden"
                    onChange={async (event) => {
                      const nextFile = event.target.files?.[0] ?? null;
                      await handleResumeFileChange(nextFile);
                    }}
                  />
                  {!resumeFile ? (
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.05]">
                        <UploadCloud size={18} className="text-slate-300" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-100">Attach your resume</p>
                        <p className="mt-1 text-xs leading-5 text-slate-400">
                          We attach your resume context to the session payload so your interview setup stays personal and role-specific.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10">
                        <Paperclip size={18} className="text-accent" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-slate-100">{resumeFile.name}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          {(resumeFile.size / 1024 / 1024).toFixed(2)} MB attached
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          void handleResumeFileChange(null);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/6 text-slate-300 transition hover:bg-white/10"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </label>

                <label className="mt-4 block space-y-2">
                  <span className="text-xs font-mono uppercase tracking-[0.18em] text-slate-400">Resume Notes</span>
                  <textarea
                    value={resumeNotes}
                    onChange={(event) => setResumeNotes(event.target.value)}
                    placeholder="Key wins, tools, domain background, or anything you want the session context to remember."
                    rows={4}
                    className={`${fieldClassName} min-h-[110px]`}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className={`space-y-4 ${isCompactLayout ? "" : "sm:space-y-5"}`}>
            <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,20,32,0.95),rgba(8,11,20,0.94))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.3)] sm:rounded-[28px] sm:p-6">
              <div className="mb-3 flex items-center gap-2">
                <Target size={15} className="text-slate-300" />
                <h2 className="text-xs font-mono uppercase tracking-[0.24em] text-slate-400">Current Prompt</h2>
              </div>
              <p className="text-xl leading-8 text-slate-50 sm:text-2xl sm:leading-9">{question}</p>
              <p className="mt-4 text-sm leading-7 text-slate-400">
                {isCompactLayout
                  ? "Submit an answer to update the session and get the next follow-up."
                  : "Submit an answer to update your transcript, analysis, and the next follow-up question from the live session."}
              </p>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,20,32,0.95),rgba(8,11,20,0.94))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.3)] sm:rounded-[28px] sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers3 size={15} className="text-slate-300" />
                  <h2 className="text-xs font-mono uppercase tracking-[0.24em] text-slate-400">Live Session Snapshot</h2>
                </div>
                <span className={`rounded-full border px-3 py-1 text-[11px] font-mono uppercase tracking-[0.18em] ${getPlanAccent(currentPlan)}`}>
                  {formatPlanLabel(currentPlan)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs font-mono uppercase tracking-[0.18em] text-slate-400">Current Stage</p>
                  <p className="mt-2 text-lg font-display tracking-[0.08em] text-slate-100">
                    {formatStageLabel(currentSession?.currentStage || "setup")}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs font-mono uppercase tracking-[0.18em] text-slate-400">Answered</p>
                  <p className="mt-2 text-lg font-display tracking-[0.08em] text-slate-100">
                    {currentSession?.questionCount ?? 0}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs font-mono uppercase tracking-[0.18em] text-slate-400">Credits</p>
                  <p className="mt-2 text-lg font-display tracking-[0.08em] text-slate-100">
                    {currentSession?.sessionCredits ?? 0}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs font-mono uppercase tracking-[0.18em] text-slate-400">Status</p>
                  <p className="mt-2 text-lg font-display tracking-[0.08em] text-slate-100">
                    {currentSession?.activeSession ? "In Progress" : "Standby"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-5 rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,20,32,0.95),rgba(8,11,20,0.94))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.3)] sm:mb-6 sm:rounded-[28px] sm:p-6">
          <div className="mb-4 flex w-fit items-center gap-1 rounded-2xl bg-white/[0.04] p-1">
            {(["record", "upload"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setInputMode(mode)}
                className={`rounded-xl px-5 py-2 text-xs font-mono uppercase tracking-[0.18em] transition-all ${
                  inputMode === mode ? "bg-[#12192a] text-slate-100 shadow-[0_10px_24px_rgba(0,0,0,0.18)]" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <div className={`grid gap-5 ${isCompactLayout ? "" : "lg:grid-cols-[0.95fr_1.05fr]"}`}>
            <div className="space-y-4">
              {inputMode === "record" ? (
                <AudioRecorder onAudioReady={handleRecordReady} onReset={handleRecorderReset} />
              ) : (
                <UploadBox onFileReady={handleFileReady} />
              )}

              {error && (
                <p className="rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-rose-200">{error}</p>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isAnalyzing || !audioBlob}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-mono uppercase tracking-[0.2em] transition-all ${
                  isAnalyzing || !audioBlob
                    ? "cursor-not-allowed bg-white/6 text-slate-500"
                    : "bg-[linear-gradient(90deg,#00ff88,#f4b44c)] text-[#07110c] shadow-[0_18px_40px_rgba(0,255,136,0.16)] hover:scale-[1.01]"
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Analyzing
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    Analyze Answer
                  </>
                )}
              </button>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-7 text-slate-400">
                The studio keeps your role, JD, resume context, stage, and current question aligned before each analysis pass.
              </div>
            </div>

            {isCompactLayout ? (
              <div className="space-y-4">
                <AnalysisPanel analysis={analysis} isLoading={isAnalyzing} />
                <TranscriptPanel transcript={transcript} isLoading={isAnalyzing} />
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                <TranscriptPanel transcript={transcript} isLoading={isAnalyzing} />
                <AnalysisPanel analysis={analysis} isLoading={isAnalyzing} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
