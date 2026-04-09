import { memo, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Flame, Gauge, Layers3, RotateCcw, Sparkles, Target, TrendingUp } from "lucide-react";
import ScoreCard from "../components/ScoreCard";
import ScoreTrendChart from "../components/ScoreTrendChart";
import SupportFooter from "../components/SupportFooter";
import { useDeviceProfile } from "../hooks/useDeviceProfile";
import { useStartInterviewAction } from "../hooks/useStartInterviewAction";
import { getOrCreateLocalUserId, getSessions } from "../services/api";
import { useStore, type Session } from "../store";
import { track } from "../utils/track";

const STAGES = ["setup", "warmup", "core", "followup", "complete"];
const epoch = (value: number | string | null) => typeof value === "number" ? (value > 10_000_000_000 ? value : value * 1000) : typeof value === "string" && value ? (Number.isNaN(Date.parse(value)) ? Date.now() : Date.parse(value)) : Date.now();
const dateLabel = (value: number | string | null) => new Date(epoch(value)).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const stageLabel = (stage: string) => (!stage ? "setup" : stage === "resume_session" ? "warmup" : stage).replace(/_/g, " ");
const stageIndex = (stage: string) => Math.max(0, STAGES.indexOf(stageLabel(stage)));
const avgScore = (scores: number[]) => scores.length ? Math.round((scores.reduce((total, score) => total + score, 0) / scores.length) * 10) : 0;
function errorText(error: unknown) {
  if (error && typeof error === "object" && "response" in error && error.response && typeof error.response === "object" && "data" in error.response) {
    const data = error.response.data as { detail?: string };
    if (typeof data?.detail === "string") return data.detail;
  }
  return error instanceof Error && error.message ? error.message : "Unable to load dashboard data right now.";
}
function streakCount(sessions: Session[]) {
  if (!sessions.length) return 0;
  const uniqueDays = [...new Set(sessions.map((session) => new Date(epoch(session.updatedAt || session.lastSessionActivityAt || session.sessionStartedAt)).toDateString()))].map((value) => new Date(value).getTime()).sort((a, b) => b - a);
  let streak = 1;
  for (let index = 1; index < uniqueDays.length; index += 1) {
    if (Math.round((uniqueDays[index - 1] - uniqueDays[index]) / 86400000) === 1) streak += 1;
    else break;
  }
  return streak;
}
function weakAreas(sessions: Session[]) {
  const tags = new Set<string>();
  const rawScores = sessions.flatMap((session) => session.scores);
  const avg = rawScores.length ? rawScores.reduce((sum, score) => sum + score, 0) / rawScores.length : 0;
  if (avg < 7) tags.add("Communication");
  if (sessions.some((session) => session.questionCount < 2)) tags.add("Consistency");
  if (sessions.some((session) => stageLabel(session.currentStage) === "warmup")) tags.add("Technical depth");
  if (sessions.some((session) => session.activeSession && session.questionCount <= 1)) tags.add("Confidence");
  if (sessions.some((session) => session.scores.length > 0 && Math.max(...session.scores) - Math.min(...session.scores) > 2.5)) tags.add("Answer structure");
  if (!tags.size) ["Consistency", "Technical depth", "Confidence"].forEach((tag) => tags.add(tag));
  return [...tags].slice(0, 5);
}

const StageProgress = memo(function StageProgress({ session }: { session: Session | null }) {
  const active = stageIndex(session?.currentStage || "setup");
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between"><div><p className="text-sm uppercase tracking-[0.18em] text-slate-400">Current stage</p><h3 className="mt-2 text-2xl font-medium text-slate-50">{stageLabel(session?.currentStage || "setup")}</h3></div><Target size={18} className="text-accent" /></div>
      <div className="mt-5 grid gap-2 sm:grid-cols-5">{STAGES.map((stage, index) => <div key={stage} className={`rounded-[20px] border px-3 py-3 text-center text-sm uppercase tracking-[0.16em] transition-all duration-200 ease-in-out ${index < active ? "border-white/12 bg-white/[0.08] text-slate-100" : index === active ? "border-accent/30 bg-accent/12 text-accent" : "border-white/8 bg-white/[0.03] text-slate-500"}`}>{stage}</div>)}</div>
    </div>
  );
});

export default function DashboardPage() {
  const sessions = useStore((state) => state.sessions);
  const setSessions = useStore((state) => state.setSessions);
  const device = useDeviceProfile();
  const credits = useStore((state) => state.credits);
  const premiumActive = useStore((state) => state.premiumActive);
  const premiumExpiry = useStore((state) => state.premiumExpiry);
  const [userId] = useState(() => getOrCreateLocalUserId());
  const [isLoading, setIsLoading] = useState(true);
  const [warning, setWarning] = useState("");
  const startInterview = useStartInterviewAction();

  useEffect(() => {
    track("dashboard_view");
  }, []);

  const handleDashboardStart = () => {
    track("start_from_dashboard");
    startInterview();
  };

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setIsLoading(true); setWarning("");
      try {
        const nextSessions = await getSessions(userId);
        if (isMounted) setSessions(nextSessions);
      } catch (sessionError) {
        if (isMounted) { setSessions([]); setWarning(errorText(sessionError)); }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    void load();
    return () => { isMounted = false; };
  }, [setSessions, userId]);

  const recentSessions = useMemo(() => [...sessions].sort((left, right) => epoch(right.updatedAt || right.lastSessionActivityAt || right.sessionStartedAt) - epoch(left.updatedAt || left.lastSessionActivityAt || left.sessionStartedAt)).slice(0, 10), [sessions]);
  const scoreSeries = useMemo(() => recentSessions.filter((session) => session.scores.length > 0).map((session, index) => ({ label: `S${Math.max(1, recentSessions.length - index)}`, score: avgScore(session.scores) })).reverse(), [recentSessions]);
  const totalInterviews = recentSessions.length;
  const average = scoreSeries.length ? Math.round(scoreSeries.reduce((sum, point) => sum + point.score, 0) / scoreSeries.length) : 0;
  const streak = streakCount(recentSessions);
  const areas = weakAreas(recentSessions);
  const currentSession = recentSessions[0] ?? null;
  const mobileChartHeight = device.isMobile || device.isStandalone ? 220 : 280;

  if (isLoading) {
    return <div className="min-h-dvh bg-[#070b14] noise-overlay"><div className="mx-auto max-w-7xl px-4 py-6 sm:px-6"><div className="grid gap-4 sm:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-32 animate-pulse rounded-[28px] border border-white/10 bg-white/[0.03]" />)}</div></div></div>;
  }

  return (
    <div className="min-h-dvh bg-[#070b14] noise-overlay">
      <div className="pointer-events-none fixed inset-0 overflow-hidden"><div className="absolute inset-x-0 top-0 h-[360px] bg-[radial-gradient(circle_at_top,_rgba(244,180,76,0.16),_transparent_38%),radial-gradient(circle_at_20%_20%,_rgba(0,255,136,0.1),_transparent_30%),radial-gradient(circle_at_80%_20%,_rgba(74,144,226,0.12),_transparent_30%)]" /></div>
      <div className="relative mx-auto max-w-7xl space-y-5 px-4 py-5 sm:px-6 sm:py-6">
        <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,24,38,0.96),rgba(8,11,20,0.95))] p-4 shadow-[0_30px_80px_rgba(0,0,0,0.35)] sm:rounded-[32px] sm:p-6">
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <div className="flex flex-col gap-4">
                <div><p className="text-sm uppercase tracking-[0.24em] text-accent">Retention dashboard</p><h1 className="mt-3 font-display text-3xl leading-[0.92] tracking-[0.05em] text-slate-50 sm:text-5xl">Keep your interview momentum visible</h1><p className="mt-4 max-w-2xl text-base leading-8 text-slate-300">Track score movement, spot weak areas, and jump straight back into the next practice round before momentum drops.</p></div>
                <button type="button" onClick={handleDashboardStart} className="inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(90deg,#00ff88,#f4b44c)] px-5 py-3 text-base font-medium text-[#07110c] transition-transform duration-200 ease-in-out hover:scale-[1.02]">Start Interview<RotateCcw size={18} /></button>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4 sm:rounded-[28px] sm:p-5"><div className="flex items-center justify-between"><p className="text-sm uppercase tracking-[0.18em] text-slate-400">Total interviews</p><Layers3 size={18} className="text-accent" /></div><p className="mt-4 font-display text-4xl leading-none tracking-[0.05em] text-slate-50 sm:text-5xl">{totalInterviews}</p></div>
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4 sm:rounded-[28px] sm:p-5"><div className="flex items-center justify-between"><p className="text-sm uppercase tracking-[0.18em] text-slate-400">Avg score</p><Gauge size={18} className="text-accent" /></div><p className="mt-4 font-display text-4xl leading-none tracking-[0.05em] text-slate-50 sm:text-5xl">{average}</p></div>
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4 sm:rounded-[28px] sm:p-5"><div className="flex items-center justify-between"><p className="text-sm uppercase tracking-[0.18em] text-slate-400">{premiumActive ? "Premium expiry" : "Remaining sessions"}</p>{premiumActive ? <Flame size={18} className="text-amber-300" /> : <Layers3 size={18} className="text-accent" />}</div><p className="mt-4 font-display text-3xl leading-none tracking-[0.05em] text-slate-50 sm:text-4xl">{premiumActive ? dateLabel(premiumExpiry) : credits}</p></div>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="flex items-center gap-2"><TrendingUp size={18} className="text-accent" /><p className="text-sm uppercase tracking-[0.2em] text-slate-400">Score graph</p></div>
                  <h2 className="mt-3 font-display text-3xl leading-none tracking-[0.05em] text-slate-50 sm:text-4xl">Your improvement curve</h2>
                </div>
                <p className="text-base text-slate-300">Each session stacks into a visible progression line so improvement feels measurable.</p>
              </div>
              <div className="mt-6"><ScoreTrendChart data={scoreSeries} height={mobileChartHeight + 40} /></div>
            </div>
          </div>
        </section>

        {warning && <div className="rounded-[24px] border border-rose-400/20 bg-rose-400/10 px-4 py-4 text-base text-rose-200">{warning}</div>}

        <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,24,38,0.96),rgba(8,11,20,0.94))] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.28)] sm:p-6">
              <div className="flex items-center gap-2"><Sparkles size={18} className="text-amber-200" /><p className="text-sm uppercase tracking-[0.2em] text-slate-400">Weak areas</p></div>
              <div className="mt-5 flex flex-wrap gap-2">{areas.map((tag) => <span key={tag} className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm text-slate-100">{tag}</span>)}</div>
            </div>
            <StageProgress session={currentSession} />
          </div>
          <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,24,38,0.96),rgba(8,11,20,0.94))] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.28)] sm:p-6">
            <div className="flex items-center gap-2"><Target size={18} className="text-accent" /><p className="text-sm uppercase tracking-[0.2em] text-slate-400">Progress signal</p></div>
            <p className="mt-4 text-lg leading-8 text-slate-100">Keep the loop moving: review the graph, target the weak tags, then jump into the next timed round.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm uppercase tracking-[0.16em] text-slate-400">Current stage</p>
                <p className="mt-3 text-lg text-slate-100">{stageLabel(currentSession?.currentStage || "setup")}</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm uppercase tracking-[0.16em] text-slate-400">Streak</p>
                <p className="mt-3 text-lg text-slate-100">{streak} day{streak === 1 ? "" : "s"}</p>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
                <p className="text-sm uppercase tracking-[0.16em] text-slate-400">Latest score</p>
                <p className="mt-3 text-lg text-slate-100">{scoreSeries.at(-1)?.score ?? 0}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-sm uppercase tracking-[0.18em] text-slate-400">Session history</p><h2 className="mt-2 font-display text-3xl leading-none tracking-[0.05em] text-slate-50">Retry from what matters</h2></div>
            {currentSession && <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-200">Current stage: {stageLabel(currentSession.currentStage)}</div>}
          </div>
          {!recentSessions.length && <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,24,38,0.96),rgba(8,11,20,0.94))] px-6 py-14 text-center text-base leading-8 text-slate-300 shadow-[0_24px_60px_rgba(0,0,0,0.28)]">Run your first interview and the dashboard will start tracking progress immediately.</div>}
          {recentSessions.map((session) => (
            <div key={session.sessionId} className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,24,38,0.96),rgba(8,11,20,0.94))] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.28)] transition-all duration-200 ease-in-out hover:-translate-y-1 hover:border-white/14 sm:p-6">
              <div className="grid gap-5 lg:grid-cols-[0.2fr_0.8fr]">
                <div className="flex justify-center lg:justify-start"><ScoreCard score={avgScore(session.scores)} size="sm" /></div>
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div><p className="text-2xl text-slate-50">{session.role || "Interview session"}</p><div className="mt-2 inline-flex items-center gap-2 text-sm text-slate-400"><Calendar size={14} />{dateLabel(session.updatedAt || session.lastSessionActivityAt || session.sessionStartedAt)}</div></div>
                    <button type="button" onClick={handleDashboardStart} className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-100 transition-all duration-200 ease-in-out hover:border-accent/25 hover:bg-white/[0.08]">Start Interview<RotateCcw size={16} /></button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"><p className="text-sm uppercase tracking-[0.18em] text-slate-400">Role</p><p className="mt-3 text-lg text-slate-100">{session.role || "Interview session"}</p></div>
                    <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"><p className="text-sm uppercase tracking-[0.18em] text-slate-400">Score</p><p className="mt-3 text-lg text-slate-100">{avgScore(session.scores)}</p></div>
                    <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"><p className="text-sm uppercase tracking-[0.18em] text-slate-400">Date</p><p className="mt-3 text-lg text-slate-100">{dateLabel(session.updatedAt || session.lastSessionActivityAt || session.sessionStartedAt)}</p></div>
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"><p className="text-sm uppercase tracking-[0.18em] text-slate-400">Current question</p><p className="mt-3 text-base leading-8 text-slate-100">{session.currentQuestion || "Your next question will show up here after the next practice run."}</p></div>
                </div>
              </div>
            </div>
          ))}
        </section>

        <SupportFooter />
      </div>
    </div>
  );
}
