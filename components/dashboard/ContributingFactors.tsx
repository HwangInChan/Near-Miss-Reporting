"use client";

import { CONTRIBUTING_FACTORS } from "@/lib/types";
import type { ContributingFactor } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ContributingFactorsProps {
  value: ContributingFactor[];
  onChange: (factors: ContributingFactor[]) => void;
}

/** 배후 요인(조도, 교대조, 피로도 등) 다중 선택 체크박스 */
export function ContributingFactors({ value, onChange }: ContributingFactorsProps) {
  function toggle(factor: ContributingFactor) {
    onChange(
      value.includes(factor)
        ? value.filter((f) => f !== factor)
        : [...value, factor]
    );
  }

  return (
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
              className="h-4 w-4 accent-safety-yellow"
            />
            {factor}
          </label>
        );
      })}
    </div>
  );
}
