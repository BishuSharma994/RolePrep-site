import axios from "axios";
import type { AnalysisResult, Session } from "../store";

const USER_ID_STORAGE_KEY = "roleprep_web_user_id";
const AUTH_STORAGE_KEY = "roleprep_auth_session";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
});

interface StoredAuthSession {
  authToken: string;
  email: string;
  userId: string;
  expiresAt: number;
}

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
  latest_answer_analysis?: Record<string, unknown> | null;
  pending_followup?: Record<string, unknown> | null;
}

interface AnalyzeAudioOptions {
  role: string;
  jdText: string;
  currentQuestion: string;
  userId?: string;
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

function readStoredAuthSession(): StoredAuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<StoredAuthSession>;
    if (!parsed.authToken || !parsed.userId) {
      return null;
    }

    return {
      authToken: String(parsed.authToken),
      email: String(parsed.email ?? ""),
      userId: String(parsed.userId),
      expiresAt: Number(parsed.expiresAt ?? 0),
    };
  } catch {
    return null;
  }
}

export function getStoredAuthSession() {
  return readStoredAuthSession();
}

export function getStoredAuthToken() {
  return readStoredAuthSession()?.authToken ?? "";
}

export function persistAuthSession(session: StoredAuthSession) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  }
}

export function clearStoredAuthSession() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

export function setLocalUserId(userId: string) {
  if (typeof window !== "undefined" && userId) {
    window.localStorage.setItem(USER_ID_STORAGE_KEY, userId);
  }
}

export function getPrimaryUserId() {
  return readStoredAuthSession()?.userId || getOrCreateLocalUserId();
}

API.interceptors.request.use((config) => {
  const authToken = getStoredAuthToken();
  if (authToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

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

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export function normalizeSessionPayload(session: BackendSessionPayload): Session {
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
    latestAnswerAnalysis: session.latest_answer_analysis ?? null,
    pendingFollowup: session.pending_followup ?? null,
  };
}

export function getOrCreateLocalUserId() {
  const existing = window.localStorage.getItem(USER_ID_STORAGE_KEY);

  if (existing) {
    return existing;
  }

  const nextValue = crypto.randomUUID();
  window.localStorage.setItem(USER_ID_STORAGE_KEY, nextValue);
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

  return normalizeSessionPayload(data.session ?? {});
}

export async function analyzeAudio(file: File, options: AnalyzeAudioOptions) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("role", options.role);
  formData.append("jd_text", options.jdText);
  formData.append("current_question", options.currentQuestion);
  formData.append("user_id", options.userId ?? getPrimaryUserId());

  const { data } = await API.post("/analyze-audio", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return data;
}

export async function getSessions(userId?: string) {
  const authToken = getStoredAuthToken();
  const response = await API.get("/sessions", {
    params: authToken ? undefined : { user_id: userId ?? getPrimaryUserId() },
  });

  const sessions = Array.isArray(response.data?.sessions) ? response.data.sessions : [];
  return sessions.map((session: BackendSessionPayload) => normalizeSessionPayload(session));
}

export async function createPaymentLink(userId: string, planType: PlanType) {
  const authToken = getStoredAuthToken();
  const { data } = await API.post("/payments/link", {
    user_id: authToken ? undefined : userId,
    plan_type: planType,
  });

  return {
    status: String(data?.status ?? ""),
    paymentLink: String(data?.payment_link ?? ""),
  };
}

export async function requestOtp(email: string) {
  const { data } = await API.post("/auth/request-otp", {
    email,
  });

  return {
    status: String(data?.status ?? ""),
    email: String(data?.email ?? email),
    expiresInSeconds: Number(data?.expires_in_seconds ?? 0),
    debugOtp: data?.debug_otp ? String(data.debug_otp) : "",
  };
}

export async function verifyOtp(email: string, otp: string, userId?: string | null) {
  const { data } = await API.post("/auth/verify-otp", {
    email,
    otp,
    user_id: userId ?? null,
  });

  return {
    status: String(data?.status ?? ""),
    userId: String(data?.user_id ?? ""),
    email: String(data?.email ?? email),
    authToken: String(data?.auth_token ?? ""),
    expiresAt: Number(data?.expires_at ?? 0),
  };
}

export async function getAuthSession() {
  const { data } = await API.get("/auth/session");
  return {
    status: String(data?.status ?? ""),
    userId: String(data?.user_id ?? ""),
    email: String(data?.email ?? ""),
    expiresAt: Number(data?.expires_at ?? 0),
  };
}

export async function logout() {
  const { data } = await API.post("/auth/logout");
  return {
    status: String(data?.status ?? ""),
  };
}

export async function createAccountLinkCode(userId: string) {
  const { data } = await API.post("/account/link-code", {
    user_id: userId,
  });

  return {
    status: String(data?.status ?? ""),
    code: String(data?.code ?? ""),
    expiresAt: Number(data?.expires_at ?? 0),
    expiresInSeconds: Number(data?.expires_in_seconds ?? 0),
  };
}

export async function linkAccount(userId: string, code: string) {
  const { data } = await API.post("/account/link", {
    user_id: userId,
    code,
  });

  return {
    status: String(data?.status ?? ""),
    userId: String(data?.user_id ?? ""),
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
  const scoreReasons = [structure, specificity, clarity, relevance, delivery];

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
  const derivedStrengths = uniqueStrings(
    scoreReasons
      .filter((detail) => detail.score >= 18 && detail.reason)
      .sort((left, right) => right.score - left.score)
      .map((detail) => detail.reason),
  ).slice(0, 3);
  const derivedIssues = uniqueStrings(
    scoreReasons
      .filter((detail) => detail.score > 0 && detail.score < 18 && detail.reason)
      .sort((left, right) => left.score - right.score)
      .map((detail) => detail.reason),
  ).slice(0, 3);
  const followupHint = String(followup.hint ?? followup.coaching_hint ?? "");

  const normalized: AnalysisResult = {
    score: clampPercentage(overallScore),
    content: {
      issues: uniqueStrings(explicitIssues.length ? explicitIssues : [...issues, ...derivedIssues]).slice(0, 4),
      strengths: uniqueStrings(strengths.length ? strengths : derivedStrengths).slice(0, 3),
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
