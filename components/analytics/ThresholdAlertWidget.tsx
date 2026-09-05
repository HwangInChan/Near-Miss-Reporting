import { AlertTriangle } from "lucide-react";
import { NEAR_MISS_ALERT_THRESHOLD } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ThresholdAlertWidgetProps {
  currentCount: number;
}

export function ThresholdAlertWidget({ currentCount }: ThresholdAlertWidgetProps) {
  const ratio = currentCount / NEAR_MISS_ALERT_THRESHOLD;
  const reached = ratio >= 1;
  const approaching = ratio >= 0.8 && !reached;

  const stateColor = reached ? "#E53935" : approaching ? "#FFC107" : "#22C55E";
  const stateLabel = reached ? "임계점 도달 · 즉시 점검 필요" : approaching ? "임계점 근접" : "정상 범위";

  return (
    <div className="flex items-center gap-4 rounded-module border border-steel-hairline bg-ink-softer p-4">
      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
        {reached && (
          <span className="absolute inset-0 rounded-full bg-safety-red/50 animate-pulse-ring" />
        )}
        <div
          className="relative flex h-12 w-12 items-center justify-center rounded-full border-2"
          style={{ borderColor: stateColor, backgroundColor: `${stateColor}22` }}
        >
          <AlertTriangle className="h-6 w-6" style={{ color: stateColor }} />
        </div>
      </div>

      <div className="flex-1">
        <p className="font-display text-lg tracking-wide text-paper">
          {currentCount} / {NEAR_MISS_ALERT_THRESHOLD}건
        </p>
        <p className="font-body text-xs" style={{ color: stateColor }}>
          {stateLabel}
        </p>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-ink">
          <div
            className={cn("h-full transition-all", reached && "animate-pulse")}
            style={{
              width: `${Math.min(100, ratio * 100)}%`,
              backgroundColor: stateColor,
            }}
          />
        </div>
      </div>
    </div>
  );
}
