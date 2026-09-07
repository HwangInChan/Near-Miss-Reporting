import { HeatmapCell, HumanErrorType, NearMissReport } from "./types";
import { FACTORY_ZONES, HEINRICH_RATIO } from "./constants";

/**
 * ============================================================
 * 집계 · 예측 계산
 *
 * 화면에 그릴 데이터를 리포트 배열에서 뽑아내는 순수 함수들.
 * DB나 브라우저 API에 의존하지 않으므로 서버·클라이언트 양쪽에서 쓸 수 있고
 * 테스트하기도 쉽다.
 * ============================================================
 */

/** 인적 오류 유형별 건수 집계 (도넛 차트용) */
export function countByHumanError(
  reports: NearMissReport[]
): { type: HumanErrorType; count: number }[] {
  const types: HumanErrorType[] = ["실수", "망각", "착오", "위반"];
  return types.map((type) => ({
    type,
    count: reports.filter((r) => r.humanErrorType === type).length,
  }));
}

/** 구역별 발생 건수를 히트맵 좌표 데이터로 변환 */
export function aggregateHeatmap(reports: NearMissReport[]): HeatmapCell[] {
  return FACTORY_ZONES.map((zone) => ({
    zoneId: zone.id,
    zoneLabel: zone.label,
    gridX: zone.gridX,
    gridY: zone.gridY,
    count: reports.filter((r) => r.zoneId === zone.id).length,
  }));
}

/** 히트맵 강도(0~1)를 계산 — 최댓값 대비 상대 비율 */
export function heatIntensity(count: number, maxCount: number): number {
  if (maxCount <= 0) return 0;
  return Math.min(1, count / maxCount);
}

/** 강도(0~1)를 신호등 계열 컬러(hex)로 변환: 녹색 → 노랑 → 빨강 */
export function intensityToColor(intensity: number): string {
  if (intensity <= 0) return "#22272C"; // ink.softer (데이터 없음)
  if (intensity < 0.4) return "#22C55E"; // safety.green
  if (intensity < 0.7) return "#FFC107"; // safety.yellow
  return "#E53935"; // safety.red
}

/**
 * 최근 발생 속도를 근거로 임계점 도달 시점을 추정한다.
 *
 * 최근 `windowDays`일간의 신고 건수로 하루 평균 발생률을 구한 뒤,
 * 남은 건수를 그 속도로 나눠 며칠 뒤 임계점에 닿을지 외삽한다.
 * 단순 선형 외삽이므로 정밀 예측이 아니라 "이 추세면 언제쯤"이라는
 * 경보용 지표로만 쓴다.
 */
export function forecastThresholdArrival(
  reports: NearMissReport[],
  threshold: number,
  windowDays = 14
) {
  const total = reports.length;
  const remaining = threshold - total;

  if (remaining <= 0) {
    return { alreadyReached: true, perDay: 0, daysLeft: 0, hasEnoughData: true };
  }

  const cutoff = Date.now() - windowDays * 86400000;
  const recentCount = reports.filter(
    (r) => new Date(r.createdAt).getTime() >= cutoff
  ).length;
  const perDay = recentCount / windowDays;

  // 최근 기간에 신고가 거의 없으면 외삽이 무의미하다.
  if (recentCount < 2 || perDay <= 0) {
    return { alreadyReached: false, perDay, daysLeft: null, hasEnoughData: false };
  }

  return {
    alreadyReached: false,
    perDay: Math.round(perDay * 10) / 10,
    daysLeft: Math.ceil(remaining / perDay),
    hasEnoughData: true,
  };
}

/**
 * 하인리히 1:29:300 법칙 기반 진행률 계산.
 * 현재 아차사고 건수를 기준으로, 통계적으로 상응하는
 * 경미 사고/중대재해 "예상치"와 임계 도달률(%)을 함께 반환한다.
 */
export function computeHeinrichProjection(nearMissCount: number, thresholdCount: number) {
  const ratio = HEINRICH_RATIO;
  const projectedMinor = nearMissCount / (ratio.nearMiss / ratio.minorAccident);
  const projectedMajor = nearMissCount / (ratio.nearMiss / ratio.majorAccident);
  const progressToThreshold = Math.min(1, nearMissCount / thresholdCount);
  return {
    projectedMinor: Math.round(projectedMinor * 10) / 10,
    projectedMajor: Math.round(projectedMajor * 100) / 100,
    progressToThreshold, // 0~1
  };
}
