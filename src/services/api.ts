import axios from "axios";
import type { AnalysisResult, Session } from "../store";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
});

interface BackendSessionPayload {
  user_id?: string;
  session_id?: string;
  role?: string;
  jd_text?: string;
  current_question?: string | null;
  current_stage?: string | null;
  question_count?: number;
  history?: string[];
  scores?: number[];
  active_session?: boolean;
  active_session_plan?: string | null;
  session_credits?: number;
  subscription_expiry?: number;
  selected_plan?: string;
  session_started_at?: number | string | null;
  last_session_activity_at?: number | string | null;
  updated_at?: number | string | null;
}

interface AnalyzeAudioOptions {
  role: string;
  jdText: string;
  currentQuestion: string;
}

interface CreateSessionPayload {
  userId: string;
  role: string;
  jdText: string;
  parserData?: Record<string, unknown>;
  resumePath?: string;
  jdPath?: string;
}

export type PlanType = "session_10" | "session_29" | "premium";

function clampPercentage(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeScoreDetail(detail: unknown) {
  if (!detail || typeof detail !== "object") {
    return { score: 0, reason: "" };
  }

  const score = Number((detail as { score?: number }).score ?? 0);
  const reason = String((detail as { reason?: string }).reason ?? "");
  return { score, reason };
}

function extractIssues(rawFailures: unknown) {
  if (!Array.isArray(rawFailures)) {
    return [];
  }

  return rawFailures
    .flatMap((failure) => {
      if (!failure || typeof failure !== "object" || !Array.isArray((failure as { issues?: unknown[] }).issues)) {
        return [];
      }

      return (failure as { issues: Array<{ reason?: string; fix?: string }> }).issues.map((issue) => issue.reason || issue.fix || "");
    })
    .filter(Boolean);
}

function extractStringList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === "string") {
        return item.trim();
      }

      if (item && typeof item === "object") {
        const candidate = (item as { text?: string; reason?: string; title?: string }).text
          ?? (item as { text?: string; reason?: string; title?: string }).reason
          ?? (item as { text?: string; reason?: string; title?: string }).title;
        return typeof candidate === "string" ? candidate.trim() : "";
      }

      return "";
    })
    .filter(Boolean);
}

function normalizeSession(session: BackendSessionPayload): Session {
  return {
    userId: String(session.user_id ?? ""),
    sessionId: String(session.session_id ?? ""),
    role: String(session.role ?? ""),
    jdText: String(session.jd_text ?? ""),
    currentQuestion: String(session.current_question ?? ""),
    currentStage: String(session.current_stage ?? ""),
    questionCount: Number(session.question_count ?? 0),
    history: Array.isArray(session.history) ? session.history.map(String) : [],
    scores: Array.isArray(session.scores) ? session.scores.map((score) => Number(score) || 0) : [],
    activeSession: Boolean(session.active_session),
    activeSessionPlan: String(session.active_session_plan ?? ""),
    sessionCredits: Number(session.session_credits ?? 0),
    subscriptionExpiry: Number(session.subscription_expiry ?? 0),
    selectedPlan: String(session.selected_plan ?? "free"),
    sessionStartedAt: session.session_started_at ?? null,
    lastSessionActivityAt: session.last_session_activity_at ?? null,
    updatedAt: session.updated_at ?? null,
  };
}

export function getOrCreateLocalUserId() {
  const storageKey = "roleprep_web_user_id";
  const existing = window.localStorage.getItem(storageKey);

  if (existing) {
    return existing;
  }

  const nextValue = crypto.randomUUID();
  window.localStorage.setItem(storageKey, nextValue);
  return nextValue;
}

export async function createSession({ userId, role, jdText, parserData, resumePath, jdPath }: CreateSessionPayload) {
  const { data } = await API.post("/sessions", {
    user_id: userId,
    role,
    jd_text: jdText,
    parser_data: {
      source: "webapp",
      ...(parserData ?? {}),
    },
    resume_path: resumePath,
    jd_path: jdPath,
  });

  return normalizeSession(data.session ?? {});
}

export async function analyzeAudio(file: File, options: AnalyzeAudioOptions) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("role", options.role);
  formData.append("jd_text", options.jdText);
  formData.append("current_question", options.currentQuestion);

  const { data } = await API.post("/analyze-audio", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return data;
}

export async function getSessions(userId: string) {
  const response = await API.get("/sessions", {
    params: {
      user_id: userId,
    },
  });

  const sessions = Array.isArray(response.data?.sessions) ? response.data.sessions : [];
  return sessions.map((session: BackendSessionPayload) => normalizeSession(session));
}

export async function createPaymentLink(userId: string, planType: PlanType) {
  const { data } = await API.post("/payments/link", {
    user_id: userId,
    plan_type: planType,
  });

  return {
    status: String(data?.status ?? ""),
    paymentLink: String(data?.payment_link ?? ""),
  };
}

export function normalizeAnalysisResponse(payload: unknown) {
  const source = (payload ?? {}) as {
    transcript?: string;
    analysis?: Record<string, unknown>;
    audio_metrics?: Record<string, unknown>;
  };

  const analysis = (source.analysis ?? {}) as Record<string, unknown>;
  const content = ((analysis.content as Record<string, unknown> | undefined) ?? analysis) as Record<string, unknown>;
  const voice = (analysis.voice as Record<string, unknown> | undefined) ?? {};
  const audioMetrics = (source.audio_metrics ?? {}) as Record<string, unknown>;
  const scores = (content.scores as Record<string, unknown> | undefined) ?? {};

  const clarity = normalizeScoreDetail(scores.clarity);
  const relevance = normalizeScoreDetail(scores.relevance);
  const delivery = normalizeScoreDetail(scores.delivery);
  const structure = normalizeScoreDetail(scores.structure);
  const specificity = normalizeScoreDetail(scores.specificity);

  const scoreEntries = [
    { label: "Structure", ...structure },
    { label: "Specificity", ...specificity },
    { label: "Clarity", ...clarity },
    { label: "Relevance", ...relevance },
    { label: "Delivery", ...delivery },
  ];

  const fillerCount = Number(voice.filler_count ?? 0);
  const speechRatePerSecond = Number(voice.speech_rate ?? 0);
  const pauseCount = Number(audioMetrics.pause_count ?? voice.long_pauses ?? 0);
  const overallScore = Number(content.overall_score_100 ?? analysis.overall_score_100 ?? 0);
  const feedbackSummary = String(content.feedback_summary ?? analysis.feedback_summary ?? "");
  const followup = (content.followup as Record<string, unknown> | undefined) ?? {};
  const issues = extractIssues(content.failures);
  const strengths = extractStringList(content.strengths ?? analysis.strengths);
  const explicitIssues = extractStringList(content.issues ?? analysis.issues);
  const followupHint = String(followup.hint ?? followup.coaching_hint ?? "");

  const normalized: AnalysisResult = {
    score: clampPercentage(overallScore),
    content: {
      issues: explicitIssues.length ? explicitIssues : issues,
      strengths,
      clarity: clampPercentage((clarity.score / 25) * 100),
      relevance: clampPercentage((relevance.score / 25) * 100),
      summary: feedbackSummary,
    },
    voice: {
      fillers: fillerCount > 0 ? [`${fillerCount} filler words detected`] : [],
      fillerCount,
      speechRate: Math.round(speechRatePerSecond * 60),
      pauses: pauseCount,
      confidence: clampPercentage((delivery.score / 25) * 100),
    },
    followUp: {
      question: String(followup.question ?? content.next_question ?? analysis.next_question ?? ""),
      hint: followupHint,
    },
    raw: analysis,
  };

  return {
    transcript: String(source.transcript ?? ""),
    analysis: normalized,
  };
}
