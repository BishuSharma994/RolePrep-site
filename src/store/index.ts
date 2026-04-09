import { create } from "zustand";

const USER_ID_STORAGE_KEY = "roleprep_web_user_id";
const AUTH_STORAGE_KEY = "roleprep_auth_session";

interface StoredAuthSession {
  authToken: string;
  email: string;
  userId: string;
  expiresAt: number;
}

export interface AnalysisResult {
  score: number;
  content: {
    issues: string[];
    strengths: string[];
    clarity: number;
    relevance: number;
    summary: string;
  };
  voice: {
    fillers: string[];
    fillerCount: number;
    speechRate: number;
    pauses: number;
    confidence: number;
  };
  followUp: {
    question: string;
    hint: string;
  };
  raw?: Record<string, unknown>;
}

export interface Session {
  userId: string;
  sessionId: string;
  role: string;
  jdText: string;
  currentQuestion: string;
  currentStage: string;
  questionCount: number;
  history: string[];
  scores: number[];
  activeSession: boolean;
  activeSessionPlan: string;
  sessionCredits: number;
  subscriptionExpiry: number;
  selectedPlan: string;
  sessionStartedAt: number | string | null;
  lastSessionActivityAt: number | string | null;
  updatedAt: number | string | null;
  latestAnswerAnalysis?: Record<string, unknown> | null;
  pendingFollowup?: Record<string, unknown> | null;
}

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

function ensureStoredUserId() {
  if (typeof window === "undefined") {
    return "";
  }

  const existingUserId = window.localStorage.getItem(USER_ID_STORAGE_KEY);
  if (existingUserId) {
    return existingUserId;
  }

  const nextUserId = crypto.randomUUID();
  window.localStorage.setItem(USER_ID_STORAGE_KEY, nextUserId);
  return nextUserId;
}

function persistUserId(userId: string) {
  if (typeof window !== "undefined" && userId) {
    window.localStorage.setItem(USER_ID_STORAGE_KEY, userId);
  }
}

function persistAuthSession(session: StoredAuthSession) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  }
}

function clearStoredAuthSession() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

function toExpiryTimestamp(value: number | string | null | undefined) {
  if (typeof value === "number") {
    return value > 10_000_000_000 ? value : value * 1000;
  }

  if (typeof value === "string" && value) {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

function deriveEntitlement(session: Session | null) {
  const credits = session?.sessionCredits ?? 0;
  const premiumExpiry = toExpiryTimestamp(session?.subscriptionExpiry ?? 0);
  const premiumActive = premiumExpiry > Date.now();

  return {
    credits,
    premiumExpiry,
    premiumActive,
  };
}

interface AppState {
  activeUserId: string;
  authToken: string | null;
  authenticatedEmail: string;
  authenticatedUserId: string;
  authExpiry: number;
  authRequired: boolean;
  anonymousModeAllowed: boolean;
  otpLoginEnabled: boolean;
  accountSyncEnabled: boolean;
  authConfigHydrated: boolean;
  transcript: string;
  analysis: AnalysisResult | null;
  currentSession: Session | null;
  sessions: Session[];
  isAnalyzing: boolean;
  credits: number;
  premiumExpiry: number;
  premiumActive: boolean;
  entitlementHydrated: boolean;
  isPaywallOpen: boolean;
  isAccountAccessOpen: boolean;
  pendingStartInterview: boolean;
  pendingRoute: string | null;

  setActiveUserId: (userId: string) => void;
  setAuthSession: (session: { authToken: string; email: string; userId: string; expiresAt: number }) => void;
  clearAuthSession: () => void;
  setAuthConfig: (config: { authRequired: boolean; anonymousModeAllowed: boolean; otpLoginEnabled: boolean; accountSyncEnabled: boolean }) => void;
  openAccountAccess: (pendingStartInterview?: boolean) => void;
  closeAccountAccess: () => void;
  setPendingStartInterview: (value: boolean) => void;
  setPendingRoute: (route: string | null) => void;
  setTranscript: (transcript: string) => void;
  setAnalysis: (analysis: AnalysisResult | null) => void;
  setCurrentSession: (session: Session | null) => void;
  setSessions: (sessions: Session[]) => void;
  addSession: (session: Session) => void;
  setIsAnalyzing: (value: boolean) => void;
  openPaywall: () => void;
  closePaywall: () => void;
  syncEntitlement: (session: Session | null) => void;
  reset: () => void;
}

const initialAuthSession = readStoredAuthSession();
const initialUserId = initialAuthSession?.userId || ensureStoredUserId();

function upsertSession(existingSessions: Session[], nextSession: Session) {
  const index = existingSessions.findIndex((session) => session.sessionId === nextSession.sessionId);

  if (index === -1) {
    return [nextSession, ...existingSessions];
  }

  const sessions = [...existingSessions];
  sessions[index] = nextSession;
  return sessions;
}

export const useStore = create<AppState>((set) => ({
  activeUserId: initialUserId,
  authToken: initialAuthSession?.authToken ?? null,
  authenticatedEmail: initialAuthSession?.email ?? "",
  authenticatedUserId: initialAuthSession?.userId ?? "",
  authExpiry: initialAuthSession?.expiresAt ?? 0,
  authRequired: false,
  anonymousModeAllowed: true,
  otpLoginEnabled: true,
  accountSyncEnabled: true,
  authConfigHydrated: false,
  transcript: "",
  analysis: null,
  currentSession: null,
  sessions: [],
  isAnalyzing: false,
  credits: 0,
  premiumExpiry: 0,
  premiumActive: false,
  entitlementHydrated: false,
  isPaywallOpen: false,
  isAccountAccessOpen: false,
  pendingStartInterview: false,
  pendingRoute: null,

  setActiveUserId: (userId) => {
    persistUserId(userId);
    set({ activeUserId: userId });
  },
  setAuthSession: ({ authToken, email, userId, expiresAt }) => {
    persistUserId(userId);
    persistAuthSession({ authToken, email, userId, expiresAt });
    set({
      activeUserId: userId,
      authToken,
      authenticatedEmail: email,
      authenticatedUserId: userId,
      authExpiry: expiresAt,
    });
  },
  clearAuthSession: () => {
    clearStoredAuthSession();
    const fallbackUserId = ensureStoredUserId();
    set({
      activeUserId: fallbackUserId,
      authToken: null,
      authenticatedEmail: "",
      authenticatedUserId: "",
      authExpiry: 0,
    });
  },
  setAuthConfig: ({ authRequired, anonymousModeAllowed, otpLoginEnabled, accountSyncEnabled }) =>
    set({
      authRequired,
      anonymousModeAllowed,
      otpLoginEnabled,
      accountSyncEnabled,
      authConfigHydrated: true,
    }),
  openAccountAccess: (pendingStartInterview = false) =>
    set((state) => ({
      isAccountAccessOpen: true,
      pendingStartInterview: pendingStartInterview || state.pendingStartInterview,
    })),
  closeAccountAccess: () => set({ isAccountAccessOpen: false }),
  setPendingStartInterview: (pendingStartInterview) => set({ pendingStartInterview }),
  setPendingRoute: (pendingRoute) => set({ pendingRoute }),
  setTranscript: (transcript) => set({ transcript }),
  setAnalysis: (analysis) => set({ analysis }),
  setCurrentSession: (currentSession) => {
    if (currentSession?.userId) {
      persistUserId(currentSession.userId);
    }

    set((state) => ({
      activeUserId: currentSession?.userId || state.activeUserId,
      currentSession,
      entitlementHydrated: true,
      ...deriveEntitlement(currentSession),
    }));
  },
  setSessions: (sessions) =>
    set((state) => {
      const source = sessions[0] ?? state.currentSession ?? null;
      const nextUserId = sessions[0]?.userId ?? state.activeUserId;
      persistUserId(nextUserId);
      return {
        activeUserId: nextUserId,
        sessions,
        entitlementHydrated: true,
        ...deriveEntitlement(source),
      };
    }),
  addSession: (session) =>
    set((state) => {
      if (session.userId) {
        persistUserId(session.userId);
      }

      return {
        activeUserId: session.userId || state.activeUserId,
        sessions: upsertSession(state.sessions, session),
        entitlementHydrated: true,
        ...deriveEntitlement(state.currentSession ?? session),
      };
    }),
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  openPaywall: () => set({ isPaywallOpen: true }),
  closePaywall: () => set({ isPaywallOpen: false }),
  syncEntitlement: (session) => set({ entitlementHydrated: true, ...deriveEntitlement(session) }),
  reset: () => set({ transcript: "", analysis: null, currentSession: null, entitlementHydrated: false, ...deriveEntitlement(null) }),
}));
