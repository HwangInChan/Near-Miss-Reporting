"use client";

interface ContributingFactorChartProps {
  stats: { factor: string; count: number }[];
}

/**
 * 배후 요인별 발생 건수 (많은 순).
 *
 * 관리자가 리포트마다 조도 부족·피로 누적 같은 배후 요인을 태깅하지만,
 * 그 태그를 모아서 보여주는 화면이 없으면 태깅 자체가 의미를 잃는다.
 * 개별 사고의 원인이 아니라 "이 현장에서 반복되는 구조적 결함"을 드러내는 것이
 * 이 차트의 목적이다. 상위 항목이 곧 우선 개선 대상이 된다.
 */
export function ContributingFactorChart({ stats }: ContributingFactorChartProps) {
  if (stats.length === 0) {
    return (
      <p className="py-8 text-center font-body text-sm text-steel-light">
        아직 태깅된 배후 요인이 없습니다.
      </p>
    );
  }

  const max = Math.max(...stats.map((s) => s.count), 1);
  const total = stats.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-2">
        {stats.map((s, i) => {
          const ratio = s.count / max;
          // 상위 3개는 우선 개선 대상이라는 의미로 강조한다.
          const color = i === 0 ? "#E53935" : i < 3 ? "#FFC107" : "#9AA3AB";
          return (
            <li key={s.factor} className="flex items-center gap-3">
              <span className="w-24 shrink-0 font-body text-xs text-paper">{s.factor}</span>
              <span className="h-4 flex-1 overflow-hidden rounded-module bg-ink">
                <span
                  className="block h-full rounded-module transition-all"
                  style={{ width: `${Math.max(4, ratio * 100)}%`, backgroundColor: color }}
                />
              </span>
              <span className="w-14 shrink-0 text-right font-body text-xs text-steel-light">
                {s.count}건
              </span>
            </li>
          );
        })}
      </ul>
      <p className="rounded-module border border-steel-hairline bg-ink-softer px-3 py-2 font-body text-[11px] leading-snug text-steel-light">
        총 <span className="text-paper">{total}</span>건 태깅됨. 상위 항목일수록 반복되는
        구조적 결함일 가능성이 높아 우선 개선 대상입니다.
      </p>
    </div>
  );
}
