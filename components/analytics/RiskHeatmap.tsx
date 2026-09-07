"use client";

import { useMemo, useState } from "react";
import { HeatmapCell } from "@/lib/types";
import { heatIntensity, intensityToColor } from "@/lib/stats";

interface RiskHeatmapProps {
  cells: HeatmapCell[];
}

export function RiskHeatmap({ cells }: RiskHeatmapProps) {
  const [hovered, setHovered] = useState<HeatmapCell | null>(null);
  const maxCount = useMemo(() => Math.max(1, ...cells.map((c) => c.count)), [cells]);
  const cols = Math.max(...cells.map((c) => c.gridX)) + 1;

  return (
    <div className="flex flex-col gap-3">
      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        }}
      >
        {cells.map((cell) => {
          const intensity = heatIntensity(cell.count, maxCount);
          const color = intensityToColor(intensity);
          return (
            <button
              key={cell.zoneId}
              type="button"
              onMouseEnter={() => setHovered(cell)}
              onFocus={() => setHovered(cell)}
              onMouseLeave={() => setHovered(null)}
              onBlur={() => setHovered(null)}
              className="flex h-16 flex-col items-center justify-center rounded-module border border-steel-hairline font-body transition-transform hover:scale-[1.03]"
              style={{ backgroundColor: `${color}33`, borderColor: color }}
            >
              <span className="text-[11px] font-semibold text-paper">{cell.zoneId}</span>
              <span className="font-display text-lg" style={{ color }}>
                {cell.count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-1.5 rounded-module border border-steel-hairline bg-ink-softer px-3 py-2">
        <p className="break-keep font-body text-xs text-steel-light">
          {hovered ? (
            <>
              <span className="text-paper">{hovered.zoneLabel}</span> · 아차사고{" "}
              <span className="text-paper">{hovered.count}건</span>
            </>
          ) : (
            "구역에 마우스를 올리면 상세 건수가 표시됩니다."
          )}
        </p>
        <div className="flex items-center gap-3 text-[10px] text-steel-light">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 shrink-0 rounded-full bg-safety-green" /> 낮음
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 shrink-0 rounded-full bg-safety-yellow" /> 보통
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 shrink-0 rounded-full bg-safety-red" /> 높음
          </span>
        </div>
      </div>
    </div>
  );
}
