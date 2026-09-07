"use client";

import { useState } from "react";
import { ZoneRiskAssessment, gradeStyle } from "@/lib/riskAssessment";

interface RiskMatrixProps {
  assessments: ZoneRiskAssessment[];
}

/**
 * 3×3 위험성 매트릭스.
 *
 * 가로축이 중대성, 세로축이 가능성이며 각 칸의 숫자가 위험성 점수(곱)다.
 * 구역을 해당 칸에 배치하면, 단순 건수 순위로는 구분되지 않는 두 가지가
 * 분리되어 보인다.
 *   - 오른쪽 아래: 드물지만 터지면 중대한 곳 (놓치기 쉬운 위험)
 *   - 왼쪽 위: 사소하지만 반복되는 곳 (하인리히가 경고한 전조)
 * 히트맵이 "얼마나 자주"만 보여준다면, 이 매트릭스는 "얼마나 위험한가"를 보여준다.
 */
export function RiskMatrix({ assessments }: RiskMatrixProps) {
  const [hovered, setHovered] = useState<ZoneRiskAssessment | null>(null);
  const placed = assessments.filter((a) => a.reportCount > 0);

  // 가능성 3(상) → 1(하) 순으로 위에서 아래로 그린다.
  const rows = [3, 2, 1];
  const cols = [1, 2, 3];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        {/* 세로축 라벨 */}
        <div className="flex w-5 shrink-0 items-center justify-center">
          <span className="whitespace-nowrap font-body text-[10px] text-steel-light [writing-mode:vertical-rl] [transform:rotate(180deg)]">
            가능성(빈도) →
          </span>
        </div>

        <div className="flex-1">
          <div className="grid grid-cols-3 gap-1.5">
            {rows.map((likelihood) =>
              cols.map((severity) => {
                const score = likelihood * severity;
                const grade = score >= 6 ? "높음" : score >= 3 ? "보통" : "낮음";
                const style = gradeStyle(grade);
                const zonesHere = placed.filter(
                  (a) => a.likelihood === likelihood && a.severity === severity
                );

                return (
                  <div
                    key={`${likelihood}-${severity}`}
                    className="flex min-h-[68px] flex-col items-center justify-center gap-1 rounded-module border p-1.5"
                    style={{
                      borderColor: `${style.color}66`,
                      backgroundColor: `${style.color}14`,
                    }}
                  >
                    <span
                      className="font-display text-[11px]"
                      style={{ color: style.color }}
                    >
                      {score}
                    </span>
                    <div className="flex flex-wrap justify-center gap-1">
                      {zonesHere.map((z) => (
                        <button
                          key={z.zoneId}
                          type="button"
                          onMouseEnter={() => setHovered(z)}
                          onMouseLeave={() => setHovered(null)}
                          onFocus={() => setHovered(z)}
                          onBlur={() => setHovered(null)}
                          className="rounded-module px-1.5 py-0.5 font-body text-[11px] font-semibold text-ink transition-transform hover:scale-110"
                          style={{ backgroundColor: style.color }}
                        >
                          {z.zoneId}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 가로축 라벨 */}
          <div className="mt-1.5 grid grid-cols-3 gap-1.5">
            {["소", "중", "대"].map((l) => (
              <span
                key={l}
                className="text-center font-body text-[10px] text-steel-light"
              >
                {l}
              </span>
            ))}
          </div>
          <p className="mt-0.5 text-center font-body text-[10px] text-steel-light">
            중대성(강도) →
          </p>
        </div>
      </div>

      <div className="min-h-[2.5rem] rounded-module border border-steel-hairline bg-ink-softer px-3 py-2">
        {hovered ? (
          <p className="font-body text-xs text-steel-light">
            <span className="text-paper">{hovered.zoneLabel}</span> · 신고{" "}
            {hovered.reportCount}건
            <br />
            가능성 {hovered.likelihoodLabel} × 중대성 {hovered.severityLabel} ={" "}
            <span style={{ color: gradeStyle(hovered.grade).color }}>
              위험성 {hovered.riskScore} ({hovered.grade})
            </span>
          </p>
        ) : (
          <p className="font-body text-xs text-steel-light">
            구역 표식에 마우스를 올리면 산출 근거가 표시됩니다. 위험성 = 가능성 × 중대성.
          </p>
        )}
      </div>
    </div>
  );
}
