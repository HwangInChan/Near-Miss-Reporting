"use client";

import { Award, Star } from "lucide-react";
import { RewardRanking } from "@/lib/types";

/**
 * 포상 집계 순위표.
 * 익명 신고는 사번이 저장되지 않아 이 집계에 애초에 들어오지 않는다.
 * 정렬 기준은 "우수 신고 수 → 총 신고 수" 순으로, 단순 건수 경쟁보다
 * 질적으로 좋은 신고가 상위에 오도록 했다.
 */
export function RewardRankingPanel({ rankings }: { rankings: RewardRanking[] }) {
  if (rankings.length === 0) {
    return (
      <p className="py-8 text-center font-body text-sm text-steel-light">
        아직 집계할 기명 신고가 없습니다.
      </p>
    );
  }

  const medalColor = ["#FFC107", "#9AA3AB", "#B87333"];

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex max-h-[260px] flex-col gap-1.5 overflow-y-auto pr-1">
        {rankings.map((r, i) => (
          <li
            key={r.employeeId}
            className="flex items-center gap-3 rounded-module border border-steel-hairline bg-ink-softer px-3 py-2"
          >
            <span
              className="w-5 shrink-0 text-center font-display text-base"
              style={{ color: i < 3 ? medalColor[i] : "#9AA3AB" }}
            >
              {i + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-body text-sm text-paper">{r.name}</span>
              <span className="block font-body text-[11px] text-steel-light">{r.employeeId}</span>
            </span>
            <span className="flex shrink-0 items-center gap-3 font-body text-xs">
              <span className="flex items-center gap-1 text-safety-yellow" title="우수 신고">
                <Star className="h-3 w-3" />
                {r.exemplaryCount}
              </span>
              <span className="text-steel-light" title="조치완료">
                조치 {r.resolvedCount}
              </span>
              <span className="w-12 text-right text-paper" title="총 신고 건수">
                {r.totalCount}건
              </span>
            </span>
          </li>
        ))}
      </ul>
      <p className="flex items-start gap-1.5 rounded-module border border-steel-hairline bg-ink-softer px-3 py-2 font-body text-[11px] text-steel-light">
        <Award className="mt-0.5 h-3 w-3 shrink-0" />
        <span>
          익명 신고는 집계에서 제외됩니다. 정렬은 우수 신고 수 우선이며, 상세 패널에서 우수
          신고를 지정할 수 있습니다.
        </span>
      </p>
    </div>
  );
}
