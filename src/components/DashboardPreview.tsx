import ScoreTrendChart from "./ScoreTrendChart";

const DASHBOARD_PREVIEW = [
  { label: "S1", score: 48 },
  { label: "S2", score: 58 },
  { label: "S3", score: 66 },
  { label: "S4", score: 73 },
  { label: "S5", score: 79 },
  { label: "S6", score: 84 },
];

const WEAK_AREAS = ["Communication", "Technical depth", "Confidence", "Story structure"];
const SESSION_ITEMS = [
  { role: "Frontend Engineer", score: "72", date: "Apr 8" },
  { role: "Product Manager", score: "78", date: "Apr 7" },
  { role: "Data Analyst", score: "81", date: "Apr 6" },
];

export default function DashboardPreview() {
  return (
    <section className="mt-10 rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(18,24,38,0.95),rgba(8,11,20,0.94))] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.32)] sm:p-6">
      <p className="text-sm uppercase tracking-[0.24em] text-slate-400">Dashboard preview</p>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
          <ScoreTrendChart data={DASHBOARD_PREVIEW} />
        </div>

        <div className="grid gap-4">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Weak areas</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {WEAK_AREAS.map((area) => (
                <span key={area} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-slate-100">
                  {area}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm uppercase tracking-[0.18em] text-slate-400">Sessions</p>
              <span className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-sm text-accent">18 total</span>
            </div>
            <div className="space-y-3">
              {SESSION_ITEMS.map((item) => (
                <div key={`${item.role}-${item.date}`} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-100">
                  <span className="truncate">{item.role}</span>
                  <span className="text-accent">{item.score}</span>
                  <span className="text-slate-400">{item.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
