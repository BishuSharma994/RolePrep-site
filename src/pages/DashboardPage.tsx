import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { ArrowLeft, Calendar, Clock3, Crown, Gauge, Layers3, Sparkles, TrendingUp } from "lucide-react";
import { useStore, type Session } from "../store";
import { getOrCreateLocalUserId, getSessions } from "../services/api";
import ScoreCard from "../components/ScoreCard";

const STAGE_ORDER = ["setup", "resume_session", "warmup", "core", "followup", "complete"];

function toEpoch(value: number | string | null) {
  if (typeof value === "number") {
    return value > 10_000_000_000 ? value : value * 1000;
  }

  if (typeof value === "string" && value) {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? Date.now() : parsed;
  }

  return Date.now();
}

function formatDate(value: number | string | null) {
  return new Date(toEpoch(value)).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDateTime(value: number | string | null) {
  return new Date(toEpoch(value)).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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

function formatStageLabel(stage: string) {
  if (!stage) {
    return "Setup";
  }

  return stage.replace(/_/g, " ").replace(/\b\w/g, (value) => value.toUpperCase());
}

function averageScore(scores: number[]) {
  if (!scores.length) {
    return 0;
  }

  return Math.round((scores.reduce((total, score) => total + score, 0) / scores.length) * 10);
}

function getBestScore(scores: number[]) {
  if (!scores.length) {
    return 0;
  }

  return Math.round(Math.max(...scores) * 10);
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

function getSessionProgress(session: Session) {
  const stageIndex = getStageIndex(session.currentStage, session.questionCount);
  const stageProgress = ((stageIndex + 1) / STAGE_ORDER.length) * 100;
  const questionProgress = Math.min(100, session.questionCount * 18);
  return Math.max(12, Math.min(100, Math.round(Math.max(stageProgress, questionProgress))));
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
    return "border-accent/40 bg-accent/12 text-accent";
  }

  if (isComplete) {
    return "border-white/12 bg-white/6 text-text-primary";
  }

  return "border-white/8 bg-white/[0.03] text-text-dim";
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
    const data = error.response.data as { detail?: string };
    if (typeof data?.detail === "string") {
      return data.detail;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Unable to load sessions from the backend.";
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-[#101726] px-3 py-2 text-xs font-mono shadow-xl">
      <p className="mb-1 text-text-secondary">{label}</p>
      <p className="text-accent">Score: {payload[0]?.value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { sessions, setSessions } = useStore();
  const [userId] = useState(() => getOrCreateLocalUserId());
  const [isLoading, setIsLoading] = useState(true);
  const [warning, setWarning] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadSessions = async () => {
      setIsLoading(true);
      setWarning("");

      try {
        const data = await getSessions(userId);
        if (isMounted) {
          setSessions(data);
        }
      } catch (sessionError) {
        if (isMounted) {
          setWarning(getErrorMessage(sessionError));
          setSessions([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadSessions();

    return () => {
      isMounted = false;
    };
  }, [setSessions, userId]);

  const displaySessions: Session[] = sessions;
  const primarySession = displaySessions[0] ?? null;
  const flattenedScores = displaySessions.flatMap((session) => session.scores).map((score) => Math.round(score * 10));
  const averageSessionScore = flattenedScores.length
    ? Math.round(flattenedScores.reduce((total, score) => total + score, 0) / flattenedScores.length)
    : 0;
  const bestSessionScore = flattenedScores.length ? Math.max(...flattenedScores) : 0;
  const totalQuestions = displaySessions.reduce((total, session) => total + session.questionCount, 0);
  const activeSessions = displaySessions.filter((session) => session.activeSession).length;
  const stageBreakdown = useMemo(
    () =>
      STAGE_ORDER.map((stage) => ({
        stage,
        count: displaySessions.filter((session) => getStageIndex(session.currentStage, session.questionCount) >= STAGE_ORDER.indexOf(stage)).length,
      })),
    [displaySessions],
  );
  const chartData = displaySessions
    .filter((session) => session.scores.length > 0)
    .map((session) => ({
      date: formatDate(session.updatedAt || session.lastSessionActivityAt || session.sessionStartedAt),
      score: averageScore(session.scores),
    }));

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-[#070b14] noise-overlay">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <div className="mb-6 flex items-center justify-between rounded-[28px] border border-white/10 bg-[#101726] p-6">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.3em] text-accent">RolePrep</p>
              <h1 className="mt-2 font-display text-4xl tracking-[0.08em] text-slate-50">Dashboard</h1>
            </div>

            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-mono uppercase tracking-[0.18em] text-text-secondary transition hover:border-white/20 hover:text-text-primary"
            >
              <ArrowLeft size={16} />
              Interview
            </Link>
          </div>

          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-24 rounded-[24px] border border-white/8 bg-white/[0.03]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#070b14] noise-overlay">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_top,_rgba(244,180,76,0.18),_transparent_38%),radial-gradient(circle_at_15%_20%,_rgba(0,255,136,0.12),_transparent_28%),radial-gradient(circle_at_80%_25%,_rgba(74,144,226,0.12),_transparent_26%)]" />
        <div className="absolute left-0 top-32 h-80 w-80 rounded-full bg-accent/8 blur-[120px]" />
        <div className="absolute right-0 top-16 h-96 w-96 rounded-full bg-amber-400/8 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl animate-fade-in space-y-5 px-4 py-6 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,24,38,0.95),rgba(8,11,20,0.94))] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-mono uppercase tracking-[0.32em] text-accent">RolePrep</p>
                <h1 className="mt-3 font-display text-5xl tracking-[0.08em] text-slate-50 sm:text-6xl">Progress Dashboard</h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                  A clearer command view of plan status, session momentum, stage completion, and answer performance across your current interview track.
                </p>
              </div>

              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-mono uppercase tracking-[0.18em] text-slate-300 transition hover:border-white/20 hover:text-slate-50"
              >
                <ArrowLeft size={16} />
                Interview
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs font-mono uppercase tracking-[0.18em] text-slate-400">Live Sessions</p>
                <p className="mt-3 text-3xl font-display tracking-[0.08em] text-slate-50">{displaySessions.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs font-mono uppercase tracking-[0.18em] text-slate-400">Avg Score</p>
                <p className="mt-3 text-3xl font-display tracking-[0.08em] text-slate-50">{averageSessionScore}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs font-mono uppercase tracking-[0.18em] text-slate-400">Best</p>
                <p className="mt-3 text-3xl font-display tracking-[0.08em] text-slate-50">{bestSessionScore}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <p className="text-xs font-mono uppercase tracking-[0.18em] text-slate-400">Questions</p>
                <p className="mt-3 text-3xl font-display tracking-[0.08em] text-slate-50">{totalQuestions}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,21,34,0.95),rgba(8,11,20,0.94))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.32)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-mono uppercase tracking-[0.24em] text-slate-400">Current Status</p>
                <h2 className="mt-2 font-display text-3xl tracking-[0.08em] text-slate-50">Live Pulse</h2>
              </div>
              <Sparkles size={18} className="text-amber-300" />
            </div>

            <div className="mt-5 space-y-3">
              <div className={`rounded-2xl border p-4 ${getPlanAccent(primarySession?.activeSessionPlan || primarySession?.selectedPlan || "free")}`}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-mono uppercase tracking-[0.22em]">Plan</p>
                  <Crown size={14} />
                </div>
                <p className="mt-3 text-2xl font-display tracking-[0.08em] text-slate-50">
                  {formatPlanLabel(primarySession?.activeSessionPlan || primarySession?.selectedPlan || "free")}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs font-mono uppercase tracking-[0.18em] text-slate-400">Current Stage</p>
                  <p className="mt-3 text-sm leading-6 text-slate-100">
                    {formatStageLabel(primarySession?.currentStage || "setup")}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs font-mono uppercase tracking-[0.18em] text-slate-400">Active</p>
                  <p className="mt-3 text-sm leading-6 text-slate-100">{activeSessions}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs font-mono uppercase tracking-[0.18em] text-slate-400">Credits</p>
                  <p className="mt-3 text-sm leading-6 text-slate-100">{primarySession?.sessionCredits ?? 0}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs font-mono uppercase tracking-[0.18em] text-slate-400">Last Active</p>
                  <p className="mt-3 text-sm leading-6 text-slate-100">
                    {primarySession ? formatDate(primarySession.lastSessionActivityAt || primarySession.updatedAt) : "No session"}
                  </p>
                </div>
              </div>

              {primarySession && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-mono uppercase tracking-[0.22em] text-slate-400">Stage Progress</p>
                    <span className="text-xs font-mono uppercase tracking-[0.18em] text-accent">
                      {getSessionProgress(primarySession)}%
                    </span>
                  </div>
                  <div className="mb-4 h-2 overflow-hidden rounded-full bg-white/6">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,#00ff88,#f4b44c)]"
                      style={{ width: `${getSessionProgress(primarySession)}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {STAGE_ORDER.map((stage, index) => (
                      <div
                        key={stage}
                        className={`rounded-2xl border px-3 py-3 text-xs font-mono uppercase tracking-[0.16em] ${getStageTone(
                          index === getStageIndex(primarySession.currentStage, primarySession.questionCount),
                          index < getStageIndex(primarySession.currentStage, primarySession.questionCount),
                        )}`}
                      >
                        {formatStageLabel(stage)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {warning && (
          <div className="rounded-2xl border border-warn/20 bg-warn/10 px-4 py-3 text-sm text-warn">
            {warning}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,20,32,0.95),rgba(8,11,20,0.94))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.32)]">
            <div className="mb-5 flex items-center gap-2">
              <TrendingUp size={15} className="text-slate-300" />
              <h2 className="text-xs font-mono uppercase tracking-[0.24em] text-slate-400">Performance Trend</h2>
            </div>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData}>
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#77819a", fontSize: 11, fontFamily: "JetBrains Mono" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: "#77819a", fontSize: 11, fontFamily: "JetBrains Mono" }}
                    axisLine={false}
                    tickLine={false}
                    width={30}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#00ff88"
                    strokeWidth={3}
                    dot={{ fill: "#f4b44c", r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: "#00ff88" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[260px] items-center justify-center text-center text-sm leading-7 text-slate-400">
                Complete a scored answer to light up your trend line.
              </div>
            )}
          </div>

          <div className="space-y-5">
            <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,20,32,0.95),rgba(8,11,20,0.94))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.32)]">
              <div className="mb-5 flex items-center gap-2">
                <Gauge size={15} className="text-slate-300" />
                <h2 className="text-xs font-mono uppercase tracking-[0.24em] text-slate-400">Stage Coverage</h2>
              </div>
              <div className="space-y-3">
                {stageBreakdown.map((entry) => (
                  <div key={entry.stage}>
                    <div className="mb-2 flex items-center justify-between text-xs font-mono uppercase tracking-[0.16em] text-slate-400">
                      <span>{formatStageLabel(entry.stage)}</span>
                      <span>{entry.count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/6">
                      <div
                        className="h-full rounded-full bg-[linear-gradient(90deg,#00ff88,#4a90e2)]"
                        style={{
                          width: `${displaySessions.length ? Math.max(8, Math.round((entry.count / displaySessions.length) * 100)) : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,20,32,0.95),rgba(8,11,20,0.94))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.32)]">
              <div className="mb-5 flex items-center gap-2">
                <Layers3 size={15} className="text-slate-300" />
                <h2 className="text-xs font-mono uppercase tracking-[0.24em] text-slate-400">Current Question</h2>
              </div>
              <p className="text-lg leading-8 text-slate-50">
                {primarySession?.currentQuestion || "Start an interview round to see the live current question here."}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.24em] text-slate-400">Session Timeline</p>
              <h2 className="mt-2 font-display text-3xl tracking-[0.08em] text-slate-50">Progress by Session</h2>
            </div>
          </div>

          {displaySessions.length === 0 && (
            <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,20,32,0.95),rgba(8,11,20,0.94))] px-6 py-14 text-center text-sm leading-7 text-slate-400 shadow-[0_24px_70px_rgba(0,0,0,0.32)]">
              No live backend sessions were found for this browser user yet.
            </div>
          )}

          {displaySessions.map((session) => {
            const progress = getSessionProgress(session);
            const stageIndex = getStageIndex(session.currentStage, session.questionCount);
            const score = averageScore(session.scores);

            return (
              <div
                key={session.sessionId}
                className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,20,32,0.95),rgba(8,11,20,0.94))] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.32)]"
              >
                <div className="grid gap-5 lg:grid-cols-[0.2fr_0.8fr]">
                  <div className="flex items-start justify-center lg:justify-start">
                    <ScoreCard score={score} size="md" />
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xl text-slate-50">{session.role || "Interview Session"}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-mono uppercase tracking-[0.16em] text-slate-400">
                          <span className="inline-flex items-center gap-1">
                            <Calendar size={12} />
                            {formatDate(session.updatedAt || session.lastSessionActivityAt || session.sessionStartedAt)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock3 size={12} />
                            {formatDateTime(session.lastSessionActivityAt || session.updatedAt || session.sessionStartedAt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className={`rounded-full border px-3 py-1 text-[11px] font-mono uppercase tracking-[0.16em] ${getPlanAccent(session.activeSessionPlan || session.selectedPlan)}`}>
                          {formatPlanLabel(session.activeSessionPlan || session.selectedPlan)}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-mono uppercase tracking-[0.16em] text-slate-300">
                          {formatStageLabel(session.currentStage || "setup")}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs font-mono uppercase tracking-[0.18em] text-slate-400">Progress</p>
                        <span className="text-xs font-mono uppercase tracking-[0.18em] text-accent">{progress}%</span>
                      </div>
                      <div className="mb-4 h-2 overflow-hidden rounded-full bg-white/6">
                        <div
                          className="h-full rounded-full bg-[linear-gradient(90deg,#00ff88,#f4b44c)]"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
                        {STAGE_ORDER.map((stage, index) => (
                          <div
                            key={`${session.sessionId}-${stage}`}
                            className={`rounded-2xl border px-3 py-2 text-center text-[11px] font-mono uppercase tracking-[0.14em] ${getStageTone(
                              index === stageIndex,
                              index < stageIndex,
                            )}`}
                          >
                            {formatStageLabel(stage)}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-xs font-mono uppercase tracking-[0.18em] text-slate-400">Questions</p>
                        <p className="mt-2 text-2xl font-display tracking-[0.08em] text-slate-50">{session.questionCount}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-xs font-mono uppercase tracking-[0.18em] text-slate-400">Best Score</p>
                        <p className="mt-2 text-2xl font-display tracking-[0.08em] text-slate-50">{getBestScore(session.scores)}</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                        <p className="text-xs font-mono uppercase tracking-[0.18em] text-slate-400">Credits</p>
                        <p className="mt-2 text-2xl font-display tracking-[0.08em] text-slate-50">{session.sessionCredits}</p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <p className="text-xs font-mono uppercase tracking-[0.18em] text-slate-400">Current Question</p>
                      <p className="mt-3 text-sm leading-7 text-slate-200">
                        {session.currentQuestion || "A new question will appear here when the backend advances the session."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
