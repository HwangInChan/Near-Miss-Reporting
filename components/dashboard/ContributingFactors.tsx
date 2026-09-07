"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { CONTRIBUTING_FACTORS } from "@/lib/types";
import type { ContributingFactor } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ContributingFactorsProps {
  value: ContributingFactor[];
  onChange: (factors: ContributingFactor[]) => void;
}

/** 자유 입력 항목 1개의 최대 길이 (서버에서도 동일하게 검증한다) */
const MAX_CUSTOM_LENGTH = 30;

/**
 * 배후 요인(잠재 조건) 다중 선택.
 *
 * 기본 선택지에 없는 요인은 직접 입력할 수 있다. 현장마다 고유한 조건이 있는데
 * 목록을 고정해두면 관리자가 억지로 비슷한 항목에 끼워 맞추게 되고, 그러면
 * 집계 데이터의 의미가 왜곡된다.
 */
export function ContributingFactors({ value, onChange }: ContributingFactorsProps) {
  const [customText, setCustomText] = useState("");

  // 기본 목록에 없는 값 = 직접 입력된 항목
  const customFactors = value.filter((f) => !CONTRIBUTING_FACTORS.includes(f));

  function toggle(factor: ContributingFactor) {
    onChange(
      value.includes(factor) ? value.filter((f) => f !== factor) : [...value, factor]
    );
  }

  function addCustom() {
    const text = customText.trim().slice(0, MAX_CUSTOM_LENGTH);
    if (!text || value.includes(text)) {
      setCustomText("");
      return;
    }
    onChange([...value, text]);
    setCustomText("");
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-x-3 gap-y-2">
        {CONTRIBUTING_FACTORS.map((factor) => {
          const checked = value.includes(factor);
          return (
            <label
              key={factor}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-module border px-2.5 py-2 font-body text-sm transition-colors",
                checked
                  ? "border-safety-yellow bg-safety-yellow/10 text-paper"
                  : "border-steel-hairline bg-ink-softer text-steel-light"
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(factor)}
                className="h-4 w-4 shrink-0 accent-safety-yellow"
              />
              {factor}
            </label>
          );
        })}
      </div>

      {/* 직접 입력된 항목들 */}
      {customFactors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {customFactors.map((f) => (
            <span
              key={f}
              className="flex items-center gap-1.5 rounded-module border border-safety-yellow bg-safety-yellow/10 px-2.5 py-1 font-body text-sm text-paper"
            >
              {f}
              <button
                type="button"
                onClick={() => toggle(f)}
                aria-label={`${f} 제거`}
                className="text-steel-light hover:text-paper"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* 기타 직접 입력 */}
      <div className="flex gap-2">
        <input
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
          maxLength={MAX_CUSTOM_LENGTH}
          placeholder="기타 요인 직접 입력"
          className="min-w-0 flex-1 rounded-module border border-steel-hairline bg-ink-softer px-3 py-2 font-body text-sm text-paper outline-none placeholder:text-steel-light focus:border-safety-yellow"
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={!customText.trim()}
          className="flex shrink-0 items-center gap-1 rounded-module border border-steel bg-ink-softer px-3 py-2 font-body text-sm text-steel-light transition-colors hover:text-paper disabled:opacity-30"
        >
          <Plus className="h-4 w-4" />
          추가
        </button>
      </div>
    </div>
  );
}
