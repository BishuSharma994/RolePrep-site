import { create } from "zustand";

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

  setTranscript: (transcript) => set({ transcript }),
  setAnalysis: (analysis) => set({ analysis }),
  setCurrentSession: (currentSession) =>
    set(() => ({
      currentSession,
      entitlementHydrated: true,
      ...deriveEntitlement(currentSession),
    })),
  setSessions: (sessions) =>
    set((state) => {
      const source = state.currentSession ?? sessions[0] ?? null;
      return {
        sessions,
        entitlementHydrated: true,
        ...deriveEntitlement(source),
      };
    }),
  addSession: (session) =>
    set((state) => ({
      sessions: upsertSession(state.sessions, session),
      entitlementHydrated: true,
      ...deriveEntitlement(state.currentSession ?? session),
    })),
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  openPaywall: () => set({ isPaywallOpen: true }),
  closePaywall: () => set({ isPaywallOpen: false }),
  syncEntitlement: (session) => set({ entitlementHydrated: true, ...deriveEntitlement(session) }),
  reset: () => set({ transcript: "", analysis: null, currentSession: null, entitlementHydrated: false, ...deriveEntitlement(null) }),
}));
