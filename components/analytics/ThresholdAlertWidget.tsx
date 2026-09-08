import { AlertTriangle, CalendarClock, TrendingUp } from "lucide-react";
import { NearMissReport } from "@/lib/types";
import { cn } from "@/lib/utils";
import { forecastThresholdArrival } from "@/lib/stats";

interface ThresholdAlertWidgetProps {
  reports: NearMissReport[];
  /** 사업장별로 설정된 임계점 (기본 50건) */
  threshold: number;
}

export function ThresholdAlertWidget({ reports, threshold }: ThresholdAlertWidgetProps) {
  const currentCount = reports.length;
  const ratio = currentCount / threshold;
  const reached = ratio >= 1;
  const approaching = ratio >= 0.8 && !reached;

  const stateColor = reached ? "#E53935" : approaching ? "#FFC107" : "#22C55E";
  const stateLabel = reached
    ? "임계점 도달 · 즉시 점검 필요"
    : approaching
      ? "임계점 근접"
      : "정상 범위";

  const forecast = forecastThresholdArrival(reports, threshold);

  return (
    <div className="flex flex-col gap-3">
      {/* 현재 누적 건수 + 진행률 */}
      <div className="flex items-center gap-3 rounded-module border border-steel-hairline bg-ink-softer p-3.5">
        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
          {reached && (
            <span className="absolute inset-0 rounded-full bg-safety-red/50 animate-pulse-ring" />
          )}
          <div
            className="relative flex h-12 w-12 items-center justify-center rounded-full border-2"
            style={{ borderColor: stateColor, backgroundColor: `${stateColor}22` }}
          >
            <AlertTriangle className="h-5 w-5" style={{ color: stateColor }} />
          </div>
        </div>

        <div className="flex-1">
          <p className="font-display text-lg tracking-wide text-paper">
            {currentCount} / {threshold}건
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

      {/* 최근 발생 속도 기반 임계점 도달 예측 */}
      <div className="flex items-center gap-3 rounded-module border border-steel-hairline bg-ink-softer p-3.5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-steel bg-ink">
          <CalendarClock className="h-5 w-5 text-steel-light" />
        </div>

        <div className="flex-1">
          {forecast.alreadyReached ? (
            <>
              <p className="font-display text-lg tracking-wide text-safety-red">이미 도달</p>
              <p className="font-body text-xs text-steel-light">
                원인 분석과 조치가 시급합니다.
              </p>
            </>
          ) : forecast.hasEnoughData ? (
            <>
              <p className="font-display text-lg tracking-wide text-paper">
                약 {forecast.daysLeft}일 후 도달
              </p>
              <p className="flex items-center gap-1 font-body text-xs text-steel-light">
                <TrendingUp className="h-3 w-3 shrink-0" />
                최근 2주 하루 {forecast.perDay}건 기준
              </p>
            </>
          ) : (
            <>
              <p className="font-display text-lg tracking-wide text-steel-light">산출 불가</p>
              <p className="font-body text-xs text-steel-light">
                최근 신고가 적어 추정이 어렵습니다.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
