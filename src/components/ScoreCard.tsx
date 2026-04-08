interface Props {
  score: number;
  size?: "sm" | "md" | "lg";
}

function getScoreColor(score: number) {
  if (score >= 80) return { stroke: "#00ff88", text: "text-accent", label: "Excellent" };
  if (score >= 60) return { stroke: "#ffaa00", text: "text-warn", label: "Good" };
  return { stroke: "#ff4444", text: "text-danger", label: "Needs Work" };
}

export default function ScoreCard({ score, size = "md" }: Props) {
  const { stroke, text, label } = getScoreColor(score);
  const svgSize = size === "lg" ? 120 : size === "sm" ? 72 : 96;
  const strokeWidth = size === "sm" ? 4 : 5;
  const cx = svgSize / 2;
  const radius = svgSize / 2 - strokeWidth - 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: svgSize, height: svgSize }}>
        <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`} style={{ transform: "rotate(-90deg)" }}>
          <circle
            cx={cx}
            cy={cx}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={cx}
            cy={cx}
            r={radius}
            fill="none"
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: "stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
              filter: `drop-shadow(0 0 6px ${stroke}60)`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-display tabular-nums ${size === "lg" ? "text-4xl" : size === "sm" ? "text-xl" : "text-3xl"} ${text}`}>
            {score}
          </span>
        </div>
      </div>
      <span className={`text-xs font-mono uppercase tracking-widest ${text}`}>{label}</span>
    </div>
  );
}
