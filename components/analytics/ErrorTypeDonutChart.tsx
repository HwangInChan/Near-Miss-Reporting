import { HumanErrorType } from "@/lib/types";
import { HUMAN_ERROR_COLORS } from "@/lib/constants";

interface ErrorTypeDonutChartProps {
  data: { type: HumanErrorType; count: number }[];
}

const RADIUS = 44;
const STROKE = 18;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ErrorTypeDonutChart({ data }: ErrorTypeDonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0) || 1;

  let offsetAcc = 0;
  const segments = data.map((d) => {
    const fraction = d.count / total;
    const dash = fraction * CIRCUMFERENCE;
    const segment = {
      ...d,
      dash,
      gap: CIRCUMFERENCE - dash,
      offset: -offsetAcc,
      fraction,
    };
    offsetAcc += dash;
    return segment;
  });

  return (
    <div className="flex items-center justify-center gap-3">
      <svg viewBox="0 0 120 120" className="h-28 w-28 shrink-0 -rotate-90">
        <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="#22272C" strokeWidth={STROKE} />
        {segments.map((s) =>
          s.count === 0 ? null : (
            <circle
              key={s.type}
              cx="60"
              cy="60"
              r={RADIUS}
              fill="none"
              stroke={HUMAN_ERROR_COLORS[s.type]}
              strokeWidth={STROKE}
              strokeDasharray={`${s.dash} ${s.gap}`}
              strokeDashoffset={s.offset}
              strokeLinecap="butt"
            />
          )
        )}
        <text
          x="60"
          y="60"
          textAnchor="middle"
          dominantBaseline="central"
          className="rotate-90 font-display"
          style={{ fill: "#F2F4F5", fontSize: "28px", transformOrigin: "60px 60px" }}
        >
          {total}
        </text>
      </svg>

      <ul className="flex flex-col gap-2">
        {segments.map((s) => (
          <li key={s.type} className="flex items-center gap-2 font-body text-xs">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: HUMAN_ERROR_COLORS[s.type] }}
            />
            <span className="w-8 shrink-0 text-paper">{s.type}</span>
            <span className="whitespace-nowrap text-steel-light">
              {s.count}건 ({Math.round(s.fraction * 100)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
