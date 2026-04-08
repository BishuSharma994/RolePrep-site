import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
} from "recharts";
import { ArrowLeft, Calendar, Layers3, ShieldCheck, TrendingUp } from "lucide-react";
import { useStore, type Session } from "../store";
import { getOrCreateLocalUserId, getSessions } from "../services/api";
import ScoreCard from "../components/ScoreCard";

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

function averageScore(scores: number[]) {
  if (!scores.length) {
    return 0;
  }

  const average = scores.reduce((total, score) => total + score, 0) / scores.length;
  return Math.round(average * 10);
}

function maxScore(scores: number[]) {
  if (!scores.length) {
    return 0;
  }

  return Math.round(Math.max(...scores) * 10);
}

function clampValue(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getPlanScore(plan: string) {
  if (plan === "premium") return 100;
  if (plan === "session") return 70;
  return 40;
}

function getScoreClass(score: number) {
  if (score >= 80) return "text-accent";
  if (score >= 60) return "text-warn";
  return "text-danger";
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
    <div className="rounded-lg border border-white/10 bg-bg-overlay px-3 py-2 text-xs font-mono shadow-xl">
      <p className="mb-1 text-text-secondary">{label}</p>
      <p className="text-accent">Score: {payload[0]?.value}</p>
    </div>
  );
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
  const flattenedScores = displaySessions.flatMap((session) => session.scores).map((score) => Math.round(score * 10));
  const totalQuestions = displaySessions.reduce((total, session) => total + session.questionCount, 0);
  const activeSessions = displaySessions.filter((session) => session.activeSession).length;
  const averageSessionScore = flattenedScores.length
    ? Math.round(flattenedScores.reduce((total, score) => total + score, 0) / flattenedScores.length)
    : 0;
  const bestSessionScore = flattenedScores.length ? Math.max(...flattenedScores) : 0;
  const highestCredits = displaySessions.length ? Math.max(...displaySessions.map((session) => session.sessionCredits)) : 0;
  const chartData = displaySessions
    .filter((session) => session.scores.length > 0)
    .map((session) => ({
      date: formatDate(session.updatedAt || session.lastSessionActivityAt || session.sessionStartedAt),
      score: averageScore(session.scores),
    }));

  const radarData = [
    { metric: "Score", value: averageSessionScore },
    { metric: "Questions", value: clampValue(totalQuestions * 10) },
    { metric: "Activity", value: displaySessions.length ? clampValue((activeSessions / displaySessions.length) * 100) : 0 },
    { metric: "Credits", value: clampValue(highestCredits * 10) },
    {
      metric: "Plan",
      value: displaySessions.length
        ? Math.round(displaySessions.reduce((total, session) => total + getPlanScore(session.activeSessionPlan || session.selectedPlan), 0) / displaySessions.length)
        : 0,
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-bg-base noise-overlay">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-white/8 bg-bg-overlay/80 p-5 backdrop-blur-xl">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.3em] text-accent">RolePrep</p>
              <h1 className="mt-2 font-display text-4xl tracking-wider text-text-primary">Dashboard</h1>
            </div>

            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-mono uppercase tracking-widest text-text-secondary transition hover:border-white/20 hover:text-text-primary"
            >
              <ArrowLeft size={16} />
              Interview
            </Link>
          </div>

          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((item) => (
              <div key={item} className="card-base h-16 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-bg-base noise-overlay">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute right-0 -top-40 h-96 w-96 rounded-full bg-accent/5 blur-[120px]" />
        <div className="absolute left-0 top-1/3 h-80 w-80 rounded-full bg-emerald-500/5 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-7xl animate-fade-in space-y-5 px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-white/8 bg-bg-overlay/80 p-5 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.3em] text-accent">RolePrep</p>
            <h1 className="mt-2 font-display text-4xl tracking-wider text-text-primary sm:text-5xl">Session Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm font-body leading-relaxed text-text-secondary">
              Live session state from your backend, including active plan, question progress, and any stored answer scores.
            </p>
          </div>

          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-mono uppercase tracking-widest text-text-secondary transition hover:border-white/20 hover:text-text-primary"
          >
            <ArrowLeft size={16} />
            Interview
          </Link>
        </div>

        {warning && (
          <div className="rounded-xl border border-warn/20 bg-warn/10 px-4 py-3 text-xs font-mono uppercase tracking-widest text-warn">
            {warning}
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div className="card-base flex flex-col items-center justify-center gap-1 p-4 text-center">
            <p className="text-xs font-mono uppercase tracking-widest text-text-secondary">Active Sessions</p>
            <p className="font-display text-4xl text-text-primary">{displaySessions.length}</p>
          </div>
          <div className="card-base flex flex-col items-center justify-center gap-1 p-4 text-center">
            <p className="text-xs font-mono uppercase tracking-widest text-text-secondary">Avg Score</p>
            <p className={`font-display text-4xl ${getScoreClass(averageSessionScore)}`}>{averageSessionScore}</p>
          </div>
          <div className="card-base flex flex-col items-center justify-center gap-1 p-4 text-center">
            <p className="text-xs font-mono uppercase tracking-widest text-text-secondary">Questions</p>
            <p className="font-display text-4xl text-text-primary">{totalQuestions}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="card-base p-5">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp size={14} className="text-text-secondary" />
              <h3 className="text-xs font-mono uppercase tracking-widest text-text-secondary">Stored Score Trend</h3>
            </div>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={chartData}>
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#5a5a72", fontSize: 10, fontFamily: "JetBrains Mono" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: "#5a5a72", fontSize: 10, fontFamily: "JetBrains Mono" }}
                    axisLine={false}
                    tickLine={false}
                    width={28}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#00ff88"
                    strokeWidth={2}
                    dot={{ fill: "#00ff88", r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: "#00ff88" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[160px] items-center justify-center text-center text-sm font-body text-text-dim">
                No scored answers stored yet for this user.
              </div>
            )}
          </div>

          <div className="card-base p-5">
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck size={14} className="text-text-secondary" />
              <h3 className="text-xs font-mono uppercase tracking-widest text-text-secondary">Session Health</h3>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="65%">
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: "#5a5a72", fontSize: 10, fontFamily: "JetBrains Mono" }} />
                <Radar dataKey="value" stroke="#00ff88" fill="#00ff88" fillOpacity={0.1} strokeWidth={1.5} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-base overflow-hidden">
          <div className="border-b border-white/6 px-5 py-3">
            <h3 className="text-xs font-mono uppercase tracking-widest text-text-secondary">Backend Sessions</h3>
          </div>
          <div className="divide-y divide-white/4">
            {displaySessions.length === 0 && (
              <div className="px-5 py-8 text-center text-sm font-body text-text-dim">
                No active backend sessions found for this user ID yet.
              </div>
            )}

            {displaySessions.map((session) => {
              const sessionScore = averageScore(session.scores);

              return (
                <div key={session.sessionId} className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/2">
                  <ScoreCard score={sessionScore} size="sm" />

                  <div className="min-w-0 flex-1">
                    <p className="mb-1 truncate text-sm font-body text-text-primary">{session.role || "Interview session"}</p>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="flex items-center gap-1 text-xs font-mono text-text-dim">
                        <Calendar size={10} />
                        {formatDate(session.updatedAt || session.lastSessionActivityAt || session.sessionStartedAt)}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-mono text-text-dim">
                        <Layers3 size={10} />
                        {session.questionCount} questions
                      </span>
                    </div>
                    {session.currentQuestion && (
                      <p className="mt-2 truncate text-xs font-body text-text-secondary">
                        Current question: {session.currentQuestion}
                      </p>
                    )}
                  </div>

                  <div className="hidden shrink-0 items-center gap-2 sm:flex">
                    <span className="rounded-md bg-white/4 px-2 py-0.5 text-xs font-mono text-text-dim">
                      {session.activeSessionPlan || session.selectedPlan}
                    </span>
                    <span className="rounded-md bg-white/4 px-2 py-0.5 text-xs font-mono text-text-dim">
                      {maxScore(session.scores)} best
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
