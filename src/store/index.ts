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

interface AppState {
  transcript: string;
  analysis: AnalysisResult | null;
  currentSession: Session | null;
  sessions: Session[];
  isAnalyzing: boolean;

  setTranscript: (transcript: string) => void;
  setAnalysis: (analysis: AnalysisResult | null) => void;
  setCurrentSession: (session: Session | null) => void;
  setSessions: (sessions: Session[]) => void;
  addSession: (session: Session) => void;
  setIsAnalyzing: (value: boolean) => void;
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

  setTranscript: (transcript) => set({ transcript }),
  setAnalysis: (analysis) => set({ analysis }),
  setCurrentSession: (currentSession) => set({ currentSession }),
  setSessions: (sessions) => set({ sessions }),
  addSession: (session) => set((state) => ({ sessions: upsertSession(state.sessions, session) })),
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  reset: () => set({ transcript: "", analysis: null, currentSession: null }),
}));
