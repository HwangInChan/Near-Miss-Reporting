import { HEINRICH_RATIO } from "@/lib/constants";
import { computeHeinrichProjection } from "@/lib/utils";

interface HeinrichPyramidProps {
  nearMissCount: number;
}

const TIERS = [
  { key: "major", label: "중대재해", ratio: HEINRICH_RATIO.majorAccident, color: "#E53935" },
  { key: "minor", label: "경미 사고", ratio: HEINRICH_RATIO.minorAccident, color: "#FFC107" },
  { key: "near", label: "아차사고", ratio: HEINRICH_RATIO.nearMiss, color: "#22C55E" },
] as const;

// 꼭짓점이 뾰족한 하나의 삼각형을 그린 뒤, 높이를 3등분해 색만 다르게 칠하는 방식.
// (예전 버전은 사다리꼴 3개를 층층이 쌓아서 꼭대기가 평평하게 잘려 보였다.)
const APEX_Y = 6;
const BASE_Y = 154;
const CENTER_X = 110;
const BASE_HALF_WIDTH = 100;
const BAND_HEIGHT = (BASE_Y - APEX_Y) / TIERS.length;

function halfWidthAt(y: number): number {
  return ((y - APEX_Y) / (BASE_Y - APEX_Y)) * BASE_HALF_WIDTH;
}

function bandPoints(index: number): string {
  const yTop = APEX_Y + index * BAND_HEIGHT;
  const yBottom = APEX_Y + (index + 1) * BAND_HEIGHT;
  const bottomHalf = halfWidthAt(yBottom);

  if (index === 0) {
    // 맨 위 구간만 꼭짓점이 있는 진짜 삼각형
    return `${CENTER_X},${yTop} ${CENTER_X + bottomHalf},${yBottom} ${CENTER_X - bottomHalf},${yBottom}`;
  }

  const topHalf = halfWidthAt(yTop);
  return `${CENTER_X - topHalf},${yTop} ${CENTER_X + topHalf},${yTop} ${CENTER_X + bottomHalf},${yBottom} ${CENTER_X - bottomHalf},${yBottom}`;
}

/**
 * 1:29:300 법칙을 하나의 뾰족한 삼각형(3색 구간)으로 시각화.
 */
export function HeinrichPyramid({ nearMissCount }: HeinrichPyramidProps) {
  const { projectedMinor, projectedMajor } = computeHeinrichProjection(
    nearMissCount,
    300
  );

  const values = [projectedMajor, projectedMinor, nearMissCount];

  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox="0 0 220 160" className="w-full max-w-[220px]">
        {TIERS.map((tier, i) => (
          <polygon
            key={tier.key}
            points={bandPoints(i)}
            fill={tier.color}
            fillOpacity={0.9}
            stroke="#0B0E11"
            strokeWidth={1.25}
            strokeLinejoin="round"
          />
        ))}
      </svg>

      <dl className="grid w-full grid-cols-3 gap-2">
        {TIERS.map((tier, i) => (
          <div key={tier.key} className="flex flex-col items-center rounded-module border border-steel-hairline bg-ink-softer py-2">
            <dt className="font-body text-[11px] text-steel-light">{tier.label}</dt>
            <dd className="font-display text-xl" style={{ color: tier.color }}>
              {values[i]}
            </dd>
            <span className="font-body text-[10px] text-steel-light">1 : {tier.ratio}</span>
          </div>
        ))}
      </dl>
      <p className="text-center font-body text-xs text-steel-light">
        현재 아차사고 <span className="text-paper">{nearMissCount}건</span> 기준<br />통계적으로
        경미 사고 <span className="text-safety-yellow">{projectedMinor}건</span>, 중대재해{" "}
        <span className="text-safety-red">{projectedMajor}건</span>에 상응합니다.
      </p>
    </div>
  );
}
