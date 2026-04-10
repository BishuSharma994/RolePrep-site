import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Crown,
  Loader2,
  LogOut,
  Mic,
  PauseCircle,
  Paperclip,
  RefreshCw,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import SupportFooter from "../components/SupportFooter";
import { useAudioRecorder } from "../hooks/useAudioRecorder";
import { useDeviceProfile } from "../hooks/useDeviceProfile";
import {
  analyzeAudio,
  createPaymentLink,
  createSession,
  getSessions,
  normalizeAnalysisResponse,
  normalizeSessionPayload,
  type PlanType,
} from "../services/api";
import InterviewLayout from "../components/InterviewLayout";
import { useStore } from "../store";
import { track } from "../utils/track";

type UiState = "idle" | "listening" | "processing" | "feedback" | "next_question";

const MAX_SECONDS = 90;
const QUESTIONS = [
  "Tell me about a project where you had to make a tough tradeoff under pressure.",
  "Describe a time you disagreed with a stakeholder and how you handled it.",
  "Walk me through the most technical challenge you solved recently.",
  "Why are you a strong fit for this role right now?",
];
const PLANS: Array<{ planType: PlanType; label: string; price: string; blurb: string }> = [
  { planType: "session_10", label: "₹10", price: "1 session", blurb: "Unlock one timed simulation." },
  { planType: "session_29", label: "₹29", price: "5 sessions", blurb: "Run repeated interview drills." },
  { planType: "premium", label: "₹99", price: "Unlimited", blurb: "Unlimited access and always-on practice." },
];

const planLabel = (plan: string) => (!plan || plan === "free" ? "Free" : plan === "session_10" ? "1 session" : plan === "session_29" ? "5 session pack" : plan === "premium" ? "Premium" : plan.replace(/_/g, " "));
const timerLabel = (seconds: number) => `${Math.floor(Math.max(0, seconds) / 60)}:${String(Math.max(0, seconds) % 60).padStart(2, "0")}`;
function timeLeft(expiry: number) {
  if (!expiry) return "No active premium pass";
  const target = expiry > 10_000_000_000 ? expiry : expiry * 1000;
  const diff = target - Date.now();
  if (diff <= 0) return "Premium expired";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff / 3600000) % 24);
  return days > 0 ? `${days}d ${hours}h left` : `${hours}h ${Math.floor((diff / 60000) % 60)}m left`;
}
function errorText(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response
  ) {
    const data = error.response.data as { detail?: string | { reason?: string } };
    if (typeof data?.detail === "string") return data.detail;
    if (data?.detail && typeof data.detail === "object" && "reason" in data.detail) {
      return String(data.detail.reason ?? "Request failed.");
    }
  }
  return error instanceof Error && error.message ? error.message : "Something went wrong. Please try again.";
}

function isAccessBlockedError(error: unknown) {
  if (!error || typeof error !== "object" || !("response" in error)) {
    return false;
  }

  const response = error.response;
  if (!response || typeof response !== "object" || !("data" in response)) {
    return false;
  }

  const data = response.data as {
    code?: string;
    reason?: string;
    detail?: string | { code?: string; reason?: string; message?: string };
  };

  const directCode = typeof data.code === "string" ? data.code.toUpperCase() : "";
  if (directCode === "NO_CREDITS") {
    return true;
  }

  const directReason = typeof data.reason === "string" ? data.reason.toLowerCase() : "";
  if (directReason === "session_limit_reached" || directReason === "question_limit_reached") {
    return true;
  }

  if (data.detail && typeof data.detail === "object") {
    const nestedCode = typeof data.detail.code === "string" ? data.detail.code.toUpperCase() : "";
    if (nestedCode === "NO_CREDITS") {
      return true;
    }

    const nestedText = `${data.detail.reason ?? ""} ${data.detail.message ?? ""}`.toLowerCase();
    return nestedText.includes("no credits") || nestedText.includes("no sessions left") || nestedText.includes("session_limit_reached") || nestedText.includes("question_limit_reached");
  }

  const detailText = typeof data.detail === "string" ? data.detail.toLowerCase() : "";
  return detailText.includes("no credits") || detailText.includes("no sessions left") || detailText.includes("session_limit_reached") || detailText.includes("question_limit_reached");
}

export default function InterviewPage() {
  const navigate = useNavigate();
  const activeUserId = useStore((state) => state.activeUserId);
  const authToken = useStore((state) => state.authToken);
  const transcript = useStore((state) => state.transcript);
  const analysis = useStore((state) => state.analysis);
  const currentSession = useStore((state) => state.currentSession);
  const sessions = useStore((state) => state.sessions);
  const credits = useStore((state) => state.credits);
  const premiumActive = useStore((state) => state.premiumActive);
  const premiumExpiry = useStore((state) => state.premiumExpiry);
  const setTranscript = useStore((state) => state.setTranscript);
  const setAnalysis = useStore((state) => state.setAnalysis);
  const setCurrentSession = useStore((state) => state.setCurrentSession);
  const setSessions = useStore((state) => state.setSessions);
  const openPaywall = useStore((state) => state.openPaywall);
  const openAccountAccess = useStore((state) => state.openAccountAccess);
  const setPendingStartInterview = useStore((state) => state.setPendingStartInterview);
  const device = useDeviceProfile();
  const { state: recorderState, audioBlob, duration, errorMsg, start, stop, reset } = useAudioRecorder();

  const [uiState, setUiState] = useState<UiState>("idle");
  const [role, setRole] = useState(() => window.localStorage.getItem("roleprep_role") ?? "");
  const [jdText, setJdText] = useState(() => window.localStorage.getItem("roleprep_jd_text") ?? "");
  const [resumeNotes, setResumeNotes] = useState(() => window.localStorage.getItem("roleprep_resume_notes") ?? "");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeExcerpt, setResumeExcerpt] = useState("");
  const [question, setQuestion] = useState(QUESTIONS[0]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [activeCheckoutPlan, setActiveCheckoutPlan] = useState<PlanType | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sessionContextKey, setSessionContextKey] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentPlan = currentSession?.activeSessionPlan || currentSession?.selectedPlan || "free";
  const isPremium = premiumActive || currentPlan === "premium";
  const hasActiveFreeSession = Boolean(currentSession?.activeSession && currentPlan === "free");
  const isLocked = false;
  const countdown = Math.max(0, MAX_SECONDS - duration);
  const isMobileLayout = device.isMobile || device.isStandalone;
  const isUrgent = uiState === "listening" && countdown <= 10;
  const answeredCount = currentSession?.questionCount ?? 0;
  const displayQuestionNumber = uiState === "feedback" ? Math.max(1, Math.min(5, answeredCount)) : Math.min(5, answeredCount + 1);
  const transcriptWordCount = transcript.trim() ? transcript.trim().split(/\s+/).filter(Boolean).length : 0;
  const feedbackLooksThin = uiState === "feedback" && transcriptWordCount > 0 && transcriptWordCount < 4;
  const statusText = useMemo(
    () =>
      uiState === "listening"
        ? "Listening..."
        : uiState === "processing"
          ? "Processing..."
          : uiState === "feedback"
            ? "Feedback ready"
            : uiState === "next_question"
              ? "Moving to next question..."
              : "Ready when you are",
    [uiState],
  );

  const refreshSessions = async () => {
    const nextSessions = await getSessions(activeUserId);
    setSessions(nextSessions);

    if (nextSessions[0]) {
      setCurrentSession(nextSessions[0]);
      setSessionContextKey(`${nextSessions[0].role.trim()}::${nextSessions[0].jdText.trim()}`);
      if (nextSessions[0].currentQuestion) {
        setQuestion(nextSessions[0].currentQuestion);
      }
    } else {
      setCurrentSession(null);
      setSessionContextKey("");
    }

    return nextSessions[0] ?? null;
  };

  useEffect(() => window.localStorage.setItem("roleprep_role", role), [role]);
  useEffect(() => window.localStorage.setItem("roleprep_jd_text", jdText), [jdText]);
  useEffect(() => window.localStorage.setItem("roleprep_resume_notes", resumeNotes), [resumeNotes]);
  useEffect(() => {
    void refreshSessions();
  }, [activeUserId, authToken]);

  useEffect(() => {
    if (currentSession?.currentQuestion) {
      setQuestion(currentSession.currentQuestion);
    }
  }, [currentSession?.currentQuestion]);

  useEffect(() => {
    if (recorderState === "recording") {
      setUiState("listening");
      setError("");
      setNotice("");
    }

    if (recorderState === "error" && errorMsg) {
      setError(errorMsg);
      setUiState("idle");
    }
  }, [errorMsg, recorderState]);

  useEffect(() => {
    if (recorderState === "recording" && countdown === 0) {
      stop();
    }
  }, [countdown, recorderState, stop]);

  async function ensureSession() {
    const contextKey = `${role.trim()}::${jdText.trim()}`;
    if (currentSession && currentSession.userId === activeUserId && contextKey === sessionContextKey) {
      return currentSession;
    }

    try {
      const session = await createSession({
        userId: activeUserId,
        role: role.trim(),
        jdText: jdText.trim(),
        resumePath: resumeFile?.name,
        parserData: {
          candidate_profile: {
            resume_file_name: resumeFile?.name ?? null,
            resume_notes: resumeNotes.trim() || null,
            resume_text_excerpt: resumeExcerpt || null,
          },
        },
      });

      setCurrentSession(session);
      setSessions([session, ...sessions.filter((entry) => entry.sessionId !== session.sessionId)]);
      setSessionContextKey(contextKey);
      track("interview_start_success");
      return session;
    } catch (sessionError) {
      if (isAccessBlockedError(sessionError)) {
        track("interview_start_blocked_no_credits");
        openPaywall();
      }

      throw sessionError;
    }
  }

  async function submitResponse(blob: Blob | File) {
    if (!role.trim()) return setError("Set your target role before starting the interview.");
    if (!jdText.trim()) return setError("Paste the job description so the simulator can score against the right brief.");

    setUiState("processing");
    setError("");
    setNotice("");
    setAnalysis(null);
    setTranscript("");

    try {
      await ensureSession();
      const processingStartedAt = Date.now();

      const file =
        blob instanceof File
          ? blob
          : new File([blob], "interview-response.webm", {
              type: blob.type || "audio/webm",
            });

      track("question_answered");
      const response = await analyzeAudio(file, {
        role: role.trim(),
        jdText: jdText.trim(),
        currentQuestion: question,
        userId: activeUserId,
      });

      const normalized = normalizeAnalysisResponse(response);
      const remainingDelay = Math.max(0, 1200 - (Date.now() - processingStartedAt));
      if (remainingDelay > 0) {
        await new Promise((resolve) => window.setTimeout(resolve, remainingDelay));
      }
      setTranscript(normalized.transcript);
      setAnalysis(normalized.analysis);

      const responsePayload = response as {
        session_updated?: boolean;
        session?: Record<string, unknown>;
      };

      if (responsePayload.session_updated) {
        try {
          const refreshedSession = await refreshSessions();
          if (refreshedSession?.currentQuestion) {
            setQuestion(refreshedSession.currentQuestion);
          }
        } catch {
          if (responsePayload.session) {
            const fallbackSession = normalizeSessionPayload(responsePayload.session);
            setCurrentSession(fallbackSession);
            setSessions([fallbackSession, ...sessions.filter((entry) => entry.sessionId !== fallbackSession.sessionId)]);
            if (fallbackSession.currentQuestion) {
              setQuestion(fallbackSession.currentQuestion);
            }
          } else if (normalized.analysis.followUp.question) {
            setQuestion(normalized.analysis.followUp.question);
          }
        }
      } else if (responsePayload.session) {
        const nextSession = normalizeSessionPayload(responsePayload.session);
        setCurrentSession(nextSession);
        setSessions([nextSession, ...sessions.filter((entry) => entry.sessionId !== nextSession.sessionId)]);
        if (nextSession.currentQuestion) {
          setQuestion(nextSession.currentQuestion);
        }
      } else if (normalized.analysis.followUp.question) {
        setQuestion(normalized.analysis.followUp.question);
      }

      if (normalized.transcript.trim().split(/\s+/).filter(Boolean).length < 4) {
        setNotice("Transcript was very short. Review the score carefully before trusting it.");
      }
      setUiState("feedback");
    } catch (submissionError) {
      if (isAccessBlockedError(submissionError)) {
        track("interview_start_blocked_no_credits");
        openPaywall();
        setUiState("idle");
        return;
      }

      setError(errorText(submissionError));
      setUiState("idle");
    } finally {
      reset();
    }
  }

  useEffect(() => {
    if (recorderState === "stopped" && audioBlob) {
      void submitResponse(audioBlob);
    }
  }, [audioBlob, recorderState]);

  useEffect(() => {
    const onReturn = async () => {
      if (document.visibilityState === "hidden") return;

      try {
        const previousPlan = currentPlan;
        const next = await refreshSessions();
        const nextPlan = next?.activeSessionPlan || next?.selectedPlan || "free";
        if (previousPlan !== nextPlan && nextPlan !== "free") {
          track("payment_success");
          setNotice(`Payment confirmed. ${planLabel(nextPlan)} is active now.`);
        }
      } catch {
        // silent refresh
      }
    };

    window.addEventListener("focus", onReturn);
    document.addEventListener("visibilitychange", onReturn);

    return () => {
      window.removeEventListener("focus", onReturn);
      document.removeEventListener("visibilitychange", onReturn);
    };
  }, [currentPlan]);

  async function handleMicButton() {
    if (uiState === "processing") return;
    if (recorderState === "recording") return stop();
    if (!authToken) {
      setPendingStartInterview(true);
      openAccountAccess(true);
      return;
    }
    if (!role.trim()) return setError("Set your target role before starting the interview.");
    if (!jdText.trim()) return setError("Paste the job description before starting the interview.");

    if (!currentSession?.activeSession && !hasActiveFreeSession) {
      try {
        await ensureSession();
      } catch (sessionError) {
        if (isAccessBlockedError(sessionError)) {
          setError("");
          return;
        }

        setError(errorText(sessionError));
        return;
      }
    }

    await start();
  }

  async function handleCheckout(planType: PlanType) {
    setError("");
    setNotice("");
    setActiveCheckoutPlan(planType);
    track("payment_initiated");

    try {
      const { paymentLink } = await createPaymentLink(activeUserId, planType);
      if (!paymentLink) throw new Error("Unable to open checkout right now.");
      window.location.href = paymentLink;
    } catch (checkoutError) {
      setError(errorText(checkoutError));
    } finally {
      setActiveCheckoutPlan(null);
    }
  }

  async function handleRefreshAccess() {
    setIsRefreshing(true);
    setError("");

    try {
      const previousPlan = currentPlan;
      const next = await refreshSessions();
      const nextPlan = next?.activeSessionPlan || next?.selectedPlan || "free";
      setNotice(previousPlan !== nextPlan ? `Access updated. You are now on ${planLabel(nextPlan)}.` : "Session status refreshed.");
    } catch (refreshError) {
      setError(errorText(refreshError));
    } finally {
      setIsRefreshing(false);
    }
  }

  async function handleResumeUpload(file: File | null) {
    setResumeFile(file);
    if (!file) return setResumeExcerpt("");
    if (file.type.startsWith("text/")) return setResumeExcerpt((await file.text()).slice(0, 4000));
    setResumeExcerpt(file.name);
  }

  useEffect(() => {
    if (uiState !== "feedback" || answeredCount < 5) {
      return;
    }

    const redirectTimer = window.setTimeout(() => {
      track("session_completed");
      setAnalysis(null);
      setTranscript("");
      navigate("/dashboard");
    }, 2200);

    return () => window.clearTimeout(redirectTimer);
  }, [answeredCount, navigate, setAnalysis, setTranscript, uiState]);

  const strengthItems = analysis?.content.strengths.slice(0, 3) ?? [];
  const weaknessItems = analysis?.content.issues.slice(0, 3) ?? [];

  return (
    <div className="min-h-dvh bg-[#070b14] noise-overlay pb-44 sm:pb-32">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[360px] bg-[radial-gradient(circle_at_top,_rgba(244,180,76,0.16),_transparent_38%),radial-gradient(circle_at_20%_20%,_rgba(0,255,136,0.12),_transparent_30%),radial-gradient(circle_at_80%_20%,_rgba(74,144,226,0.12),_transparent_30%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-6">
        <div className="sticky top-[68px] z-30 mb-5 grid items-center gap-3 rounded-[22px] border border-white/10 bg-[rgba(10,14,24,0.85)] px-3 py-3 backdrop-blur-xl sm:top-[76px] sm:rounded-[26px] sm:px-4 md:grid-cols-[1fr_auto_1fr]">
          <div className="hidden items-center gap-3 md:flex">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-200">
              {isPremium ? "Unlimited access active" : `${credits} sessions left`}
            </span>
            <span className="text-sm text-slate-400">{planLabel(currentPlan)}</span>
          </div>

          <div className="mx-auto flex items-center gap-2">
            <div className={`rounded-full border px-4 py-2 text-center text-sm font-medium sm:px-5 sm:text-base ${isUrgent ? "border-rose-400/30 bg-rose-400/10 text-rose-200" : "border-accent/20 bg-accent/10 text-accent"}`}>
              {uiState === "listening" ? timerLabel(countdown) : timerLabel(MAX_SECONDS)}
            </div>
            <div className={`rounded-full border px-4 py-2 text-sm uppercase tracking-[0.18em] ${isUrgent ? "border-rose-400/25 bg-rose-400/10 text-rose-200" : "border-white/10 bg-white/[0.04] text-slate-200"}`}>
              Q {displayQuestionNumber}/5
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => void handleRefreshAccess()}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-200 transition-all duration-200 ease-in-out hover:border-white/20 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60 sm:px-4"
            >
              {isRefreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              Refresh
            </button>

            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-200 transition-all duration-200 ease-in-out hover:border-white/20 hover:bg-white/[0.08] sm:px-4"
            >
              <LogOut size={16} />
              Exit
            </Link>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="space-y-5">
            <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,24,38,0.96),rgba(8,11,20,0.94))] p-4 shadow-[0_28px_80px_rgba(0,0,0,0.34)] sm:rounded-[28px] sm:p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-accent">Interview brief</p>
              <h1 className="mt-3 font-display text-3xl leading-[0.92] tracking-[0.05em] text-slate-50 sm:text-5xl">Set the role. Then perform.</h1>
              <p className="mt-4 text-base leading-8 text-slate-300">Load the role and resume context once. The timed round takes over from there.</p>

              <div className="mt-6 grid gap-4">
                <label className="block space-y-2">
                  <span className="text-sm uppercase tracking-[0.18em] text-slate-400">Target role</span>
                  <input
                    type="text"
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                    placeholder="Senior frontend engineer"
                    className="w-full rounded-[22px] border border-white/10 bg-[#0f1420] px-4 py-3 text-base text-slate-100 outline-none transition-all duration-200 ease-in-out placeholder:text-slate-500 focus:border-accent/30 focus:bg-[#121826]"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm uppercase tracking-[0.18em] text-slate-400">Job description</span>
                  <textarea
                    value={jdText}
                    onChange={(event) => setJdText(event.target.value)}
                    rows={6}
                    placeholder="Paste the JD so the AI scores against the real role."
                    className="w-full rounded-[22px] border border-white/10 bg-[#0f1420] px-4 py-3 text-base leading-7 text-slate-100 outline-none transition-all duration-200 ease-in-out placeholder:text-slate-500 focus:border-accent/30 focus:bg-[#121826]"
                  />
                </label>

                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-2">
                    <Paperclip size={16} className="text-accent" />
                    <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Your resume</p>
                  </div>

                  <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-[20px] border border-dashed border-white/12 bg-[#0d1320] px-4 py-4 transition-all duration-200 ease-in-out hover:border-accent/20 hover:bg-[#11182a]">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt,.md"
                      className="hidden"
                      onChange={async (event) => {
                        await handleResumeUpload(event.target.files?.[0] ?? null);
                      }}
                    />
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.05]">
                      <UploadCloud size={18} className="text-slate-200" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-base text-slate-100">{resumeFile ? resumeFile.name : "Attach your resume"}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-400">Keep the interview grounded in your actual profile.</p>
                    </div>
                  </label>

                  <textarea
                    value={resumeNotes}
                    onChange={(event) => setResumeNotes(event.target.value)}
                    rows={4}
                    placeholder="Add achievements, tools, or background you want reflected in the round."
                    className="mt-4 w-full rounded-[20px] border border-white/10 bg-[#0f1420] px-4 py-3 text-base leading-7 text-slate-100 outline-none transition-all duration-200 ease-in-out placeholder:text-slate-500 focus:border-accent/30 focus:bg-[#121826]"
                  />
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,24,38,0.96),rgba(8,11,20,0.94))] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.28)] sm:rounded-[28px] sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Access state</p>
                  <h2 className="mt-2 font-display text-[2rem] leading-none tracking-[0.05em] text-slate-50 sm:text-3xl">
                    {isPremium ? "Unlimited access active" : `${credits} sessions left`}
                  </h2>
                </div>
                <Crown size={20} className="text-amber-200" />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-sm uppercase tracking-[0.16em] text-slate-400">Plan</p>
                  <p className="mt-3 text-lg text-slate-100">{planLabel(currentPlan)}</p>
                </div>
                <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-sm uppercase tracking-[0.16em] text-slate-400">Expiry</p>
                  <p className="mt-3 text-lg text-slate-100">{timeLeft(premiumExpiry)}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {PLANS.map((plan) => (
                  <button
                    key={plan.planType}
                    type="button"
                    onClick={() => void handleCheckout(plan.planType)}
                    disabled={activeCheckoutPlan !== null}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-100 transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:border-accent/25 hover:bg-white/[0.06] disabled:opacity-60"
                  >
                    {activeCheckoutPlan === plan.planType ? "Opening..." : plan.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <section className="space-y-5">
            <div className="relative">
              <InterviewLayout
                question={question}
                statusText={statusText}
                stageText={currentSession?.currentStage?.replace(/_/g, " ") || "setup"}
                answeredCount={answeredCount}
                questionNumber={displayQuestionNumber}
                totalQuestions={5}
                isProcessing={uiState === "processing"}
                isLocked={isLocked}
                isListening={uiState === "listening"}
                isUrgent={isUrgent}
                error={error}
                notice={notice}
                onUploadClick={() => fileInputRef.current?.click()}
              />

              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={async (event) => {
                  const file = event.target.files?.[0] ?? null;
                  if (file) await submitResponse(file);
                  event.target.value = "";
                }}
              />

            </div>

            {uiState === "feedback" && analysis ? (
              <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,22,36,0.96),rgba(8,11,20,0.96))] p-4 shadow-[0_26px_70px_rgba(0,0,0,0.3)] sm:rounded-[28px] sm:p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-accent">Feedback ready</p>
                    <h3 className="mt-2 font-display text-3xl leading-none tracking-[0.05em] text-slate-50 sm:text-4xl">{analysis.score}/100</h3>
                    <p className="mt-2 text-base text-slate-300">Score for question {displayQuestionNumber} of 5</p>
                    {answeredCount >= 5 && <p className="mt-2 text-sm uppercase tracking-[0.18em] text-amber-200">Final round complete. Redirecting to dashboard...</p>}
                    {analysis.content.summary && <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">{analysis.content.summary}</p>}
                    {feedbackLooksThin && <p className="mt-3 rounded-[18px] border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">The transcript came back very short, so this score may be less reliable.</p>}
                  </div>

                  {answeredCount < 5 && (
                    <button
                      type="button"
                      onClick={() => {
                        setUiState("next_question");
                        window.setTimeout(() => {
                          setUiState("idle");
                          setAnalysis(null);
                          setTranscript("");
                          setNotice("Next question loaded. Start when you're ready.");
                        }, 700);
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(90deg,#00ff88,#f4b44c)] px-5 py-3 text-base font-medium text-[#07110c] transition-transform duration-200 ease-in-out hover:scale-[1.02]"
                    >
                      Next question
                      <RefreshCw size={18} />
                    </button>
                  )}
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Strengths</p>
                    {strengthItems.length > 0 ? (
                      <ul className="mt-4 space-y-3 text-base leading-7 text-slate-100">
                        {strengthItems.map((item, index) => <li key={`${item}-${index}`}>- {item}</li>)}
                      </ul>
                    ) : (
                      <p className="mt-4 text-sm leading-7 text-slate-400">No positive signals came back from the backend for this answer.</p>
                    )}
                  </div>

                  <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Weak areas</p>
                    {weaknessItems.length > 0 ? (
                      <ul className="mt-4 space-y-3 text-base leading-7 text-slate-100">
                        {weaknessItems.map((item, index) => <li key={`${item}-${index}`}>- {item}</li>)}
                      </ul>
                    ) : (
                      <p className="mt-4 text-sm leading-7 text-slate-400">No backend issues were returned for this answer.</p>
                    )}
                  </div>
                </div>

                {transcript && (
                  <div className="mt-4 rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Transcript used for scoring</p>
                    <p className="mt-3 text-base leading-8 text-slate-100">{transcript}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,24,38,0.96),rgba(8,11,20,0.94))] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.28)] sm:rounded-[28px] sm:p-6">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-accent" />
                  <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Feedback panel</p>
                </div>
                <p className="mt-4 text-base leading-8 text-slate-300">Score, strengths, weak areas, and the next question appear here after each answer.</p>
                {transcript && (
                  <div className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Latest transcript</p>
                    <p className="mt-3 text-base leading-8 text-slate-100">{transcript}</p>
                  </div>
                )}
              </div>
            )}

            <SupportFooter />
          </section>
        </div>

        <div className={`fixed z-40 ${isMobileLayout ? "bottom-4 left-4 right-4" : "bottom-6 right-6 w-[360px]"}`}>
          <button
            type="button"
            onClick={() => void handleMicButton()}
            disabled={uiState === "processing" || isLocked}
            className={`flex w-full items-center justify-center gap-3 rounded-full px-6 py-3.5 text-sm font-medium transition-all duration-200 ease-in-out sm:py-4 sm:text-base ${
              uiState === "processing" || isLocked
                ? "cursor-not-allowed bg-white/[0.08] text-slate-500"
                : uiState === "listening"
                  ? "bg-[linear-gradient(90deg,#ff6b6b,#f4b44c)] text-white shadow-[0_18px_40px_rgba(255,107,107,0.25)] hover:scale-[1.01]"
                  : "bg-[linear-gradient(90deg,#00ff88,#f4b44c)] text-[#07110c] shadow-[0_20px_42px_rgba(0,255,136,0.18)] hover:scale-[1.01]"
            }`}
          >
            {uiState === "processing" ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Analyzing your response...
              </>
            ) : uiState === "listening" ? (
              <>
                <PauseCircle size={20} className="animate-pulse" />
                Listening...
              </>
            ) : (
              <>
                <Mic size={20} />
                Start Interview
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
