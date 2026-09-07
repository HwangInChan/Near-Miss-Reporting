"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Lightbulb } from "lucide-react";
import { ZoneRiskAssessment, ControlLevel, gradeStyle } from "@/lib/riskAssessment";
import { cn } from "@/lib/utils";

interface RiskPriorityPanelProps {
  priorities: ZoneRiskAssessment[];
}

/** 대책 단계별 배지 색상. 근본적일수록(본질적) 강조한다. */
const LEVEL_STYLE: Record<ControlLevel, { bg: string; text: string }> = {
  본질적: { bg: "#14532D", text: "#22C55E" },
  공학적: { bg: "#1E3A5F", text: "#60A5FA" },
  관리적: { bg: "#7A5B00", text: "#FFC107" },
  보호구: { bg: "#3F3F46", text: "#9AA3AB" },
};

/**
 * 위험성 점수 순으로 정렬된 구역별 개선 우선순위.
 *
 * 이 화면의 목적은 "무엇을 먼저 손댈지"를 관리자가 머릿속으로 종합하지 않아도
 * 되게 만드는 것이다. 각 구역의 지배적 배후 요인에서 표준 대책을 도출하고,
 * Hierarchy of Controls 순서(본질적 → 공학적 → 관리적 → 보호구)로 제시한다.
 */
export function RiskPriorityPanel({ priorities }: RiskPriorityPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(
    priorities[0]?.zoneId ?? null
  );

  if (priorities.length === 0) {
    return (
      <p className="py-8 text-center font-body text-sm text-steel-light">
        평가할 신고 데이터가 아직 없습니다.
      </p>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      {/*
       * min-h-0 + flex-1: 이 목록이 "필요한 높이"를 주장하지 않게 만든다.
       * 그래야 행 높이를 왼쪽 매트릭스 카드가 결정하고, 이 목록은 남는 높이에
       * 맞춰 스크롤된다. 항목을 펼쳐도 카드 높이가 변하지 않는다.
       */}
      <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
        {priorities.map((z, i) => {
          const style = gradeStyle(z.grade);
          const isOpen = expandedId === z.zoneId;

          return (
            // shrink-0 필수: flex 자식은 기본적으로 축소되므로, 이게 없으면
            // 높이가 모자랄 때 스크롤 대신 항목이 눌려 글자가 잘린다.
            <li
              key={z.zoneId}
              className="shrink-0 overflow-hidden rounded-module border border-steel-hairline bg-ink-softer"
            >
              <button
                type="button"
                onClick={() => setExpandedId(isOpen ? null : z.zoneId)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
              >
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-module font-display text-sm text-ink"
                  style={{ backgroundColor: style.color }}
                >
                  {i + 1}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate font-body text-sm text-paper">
                    {z.zoneLabel}
                  </span>
                  <span className="block font-body text-[11px] text-steel-light">
                    신고 {z.reportCount}건 · 가능성 {z.likelihood} × 중대성 {z.severity}
                  </span>
                </span>

                <span className="flex shrink-0 items-center gap-2">
                  <span className="text-right">
                    <span
                      className="block font-display text-lg leading-none"
                      style={{ color: style.color }}
                    >
                      {z.riskScore}
                    </span>
                    <span
                      className="block font-body text-[10px]"
                      style={{ color: style.color }}
                    >
                      {z.grade}
                    </span>
                  </span>
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-steel-light" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-steel-light" />
                  )}
                </span>
              </button>

              {isOpen && (
                <div className="border-t border-steel-hairline px-3 py-3">
                  <p
                    className="mb-3 rounded-module px-2.5 py-1.5 font-body text-xs"
                    style={{ backgroundColor: `${style.color}1A`, color: style.color }}
                  >
                    판정: {style.action}
                  </p>

                  {z.dominantFactors.length > 0 && (
                    <div className="mb-3">
                      <p className="mb-1.5 font-body text-[11px] text-steel-light">
                        주요 배후 요인
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {z.dominantFactors.map((f) => (
                          <span
                            key={f.factor}
                            className="rounded-module border border-steel-hairline bg-ink px-2 py-0.5 font-body text-[11px] text-paper"
                          >
                            {f.factor} {f.count}건
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {z.measures.length > 0 ? (
                    <div className="mb-3">
                      <p className="mb-1.5 font-body text-[11px] text-steel-light">
                        권고 개선대책 (근본적인 것부터)
                      </p>
                      <ul className="flex flex-col gap-1.5">
                        {z.measures.map((m, idx) => {
                          const ls = LEVEL_STYLE[m.level];
                          return (
                            <li key={idx} className="flex items-start gap-2">
                              <span
                                className="mt-0.5 shrink-0 rounded-module px-1.5 py-0.5 font-body text-[10px] font-semibold"
                                style={{ backgroundColor: ls.bg, color: ls.text }}
                              >
                                {m.level}
                              </span>
                              <span className="font-body text-xs leading-snug text-paper">
                                {m.action}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ) : (
                    <p className="mb-3 font-body text-xs text-steel-light">
                      배후 요인이 아직 태깅되지 않아 대책을 도출할 수 없습니다.
                      리포트 상세에서 태깅해주세요.
                    </p>
                  )}

                  {z.errorTypeAdvice && (
                    <div className="flex items-start gap-2 rounded-module border border-steel-hairline bg-ink px-2.5 py-2">
                      <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-safety-yellow" />
                      <p className="font-body text-[11px] leading-relaxed text-steel-light">
                        <span className="text-paper">
                          이 구역은 &lsquo;{z.dominantErrorType}&rsquo; 유형이 가장 많습니다.
                        </span>{" "}
                        {z.errorTypeAdvice}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <p className="shrink-0 rounded-module border border-steel-hairline bg-ink-softer px-3 py-2 font-body text-[11px] leading-relaxed text-steel-light">
        위험성 = 가능성 × 중대성 (각 1~3, 최대 9). 중대성은 평균이 아니라 해당 구역에서{" "}
        <span className="text-paper">관측된 최대 심각도</span>를 사용합니다. 평균을 쓰면
        경미 사고 다수에 묻혀 중대재해 가능성이 희석되기 때문입니다.
      </p>
    </div>
  );
}
