"use client";

import { HUMAN_ERROR_TYPES } from "@/lib/types";
import type { HumanErrorType } from "@/lib/types";
import { HUMAN_ERROR_COLORS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface HumanErrorTaggerProps {
  value?: HumanErrorType;
  onChange: (type: HumanErrorType) => void;
}

const DESCRIPTIONS: Record<HumanErrorType, string> = {
  실수: "의도는 맞았으나 신체 동작이 어긋남 (Slip)",
  망각: "기억/주의가 누락되어 절차를 빠뜨림 (Lapse)",
  착오: "잘못된 판단이나 계획을 그대로 실행함 (Mistake)",
  위반: "알면서도 규정·절차를 의도적으로 벗어남 (Violation)",
};

/**
 * 현상 이면의 본질(인적 오류 원인)을 분류하는 태깅 UI.
 * Reason의 Human Error Taxonomy(실수/망각/착오/위반, 원문 Slip/Lapse/Mistake/Violation)를 사용.
 */
export function HumanErrorTagger({ value, onChange }: HumanErrorTaggerProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {HUMAN_ERROR_TYPES.map((type) => {
        const active = value === type;
        const color = HUMAN_ERROR_COLORS[type];
        return (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            className={cn(
              "flex flex-col items-start gap-0.5 rounded-module border-2 px-3 py-2.5 text-left transition-colors",
              active ? "bg-ink" : "bg-ink-softer border-steel-hairline"
            )}
            style={active ? { borderColor: color } : undefined}
          >
            <span
              className="font-display text-base tracking-wide"
              style={{ color: active ? color : "#F2F4F5" }}
            >
              {type}
            </span>
            <span className="font-body text-[11px] leading-snug text-steel-light">
              {DESCRIPTIONS[type]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
