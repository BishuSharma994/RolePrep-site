import { memo } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface Point {
  label: string;
  score: number;
}

interface Props {
  data: Point[];
  height?: number;
}

function TrendTooltip({
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
    <div className="rounded-2xl border border-white/10 bg-[#101726] px-3 py-2 text-sm shadow-xl">
      <p className="text-slate-400">{label}</p>
      <p className="mt-1 text-accent">{payload[0]?.value} score</p>
    </div>
  );
}

function ScoreTrendChartComponent({ data, height = 220 }: Props) {
  if (!data.length) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] text-center text-sm leading-7 text-slate-400">
        Your next scored answer will appear here.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <XAxis
          dataKey="label"
          tick={{ fill: "#77819a", fontSize: 12, fontFamily: "JetBrains Mono" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: "#77819a", fontSize: 12, fontFamily: "JetBrains Mono" }}
          axisLine={false}
          tickLine={false}
          width={34}
        />
        <Tooltip content={<TrendTooltip />} />
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
  );
}

const ScoreTrendChart = memo(ScoreTrendChartComponent);

export default ScoreTrendChart;
