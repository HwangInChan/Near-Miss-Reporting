import { FactoryZone, HumanErrorType, Severity } from "./types";

// 신호등 컬러 매핑 (Tailwind 클래스가 아닌, 순수 값으로 관리 → 차트/SVG에서 재사용 가능)
export const SEVERITY_COLOR: Record<Severity, { text: string; bg: string; dim: string; label: string }> = {
  low: { text: "#22C55E", bg: "bg-safety-green", dim: "#14532D", label: "경미" },
  medium: { text: "#FFC107", bg: "bg-safety-yellow", dim: "#7A5B00", label: "주의" },
  high: { text: "#E53935", bg: "bg-safety-red", dim: "#7A1F1C", label: "위험" },
};

// 공장 구역 정의 (히트맵 격자 좌표 포함, 4x3 가상 격자)
export const FACTORY_ZONES: FactoryZone[] = [
  { id: "A1", label: "A동 · 원자재 하역장", gridX: 0, gridY: 0 },
  { id: "A2", label: "A동 · 프레스 라인", gridX: 1, gridY: 0 },
  { id: "A3", label: "A동 · 용접 구역", gridX: 2, gridY: 0 },
  { id: "B1", label: "B동 · 조립 라인 1", gridX: 0, gridY: 1 },
  { id: "B2", label: "B동 · 조립 라인 2", gridX: 1, gridY: 1 },
  { id: "B3", label: "B동 · 도장 부스", gridX: 2, gridY: 1 },
  { id: "C1", label: "C동 · 물류 통로", gridX: 0, gridY: 2 },
  { id: "C2", label: "C동 · 지게차 동선", gridX: 1, gridY: 2 },
  { id: "C3", label: "C동 · 출하 검수장", gridX: 2, gridY: 2 },
];

// 하인리히 1:29:300 법칙 기준값
export const HEINRICH_RATIO = {
  majorAccident: 1,
  minorAccident: 29,
  nearMiss: 300,
};

/**
 * 아차사고 누적 건수가 이 값에 도달하면 경보 위젯이 점등된다.
 *
 * 주의: 이 값은 학술적으로 확립된 기준이 아니라 조직이 스스로 정하는 관리 기준이다.
 * (하인리히 비율에서 아차사고는 300이지만, 300건까지 방치한 뒤 경보를 울리는 것은
 *  예방 목적에 맞지 않으므로 그보다 훨씬 이른 시점을 임계점으로 잡았다.)
 * 실제 도입 시에는 사업장 규모·근로자 수·과거 재해 이력을 반영해 조정해야 한다.
 */
/** @deprecated 사업장별 설정값(lib/assessmentSettings.ts)으로 이관되었다.
 *  하위 호환을 위해 남겨두었으나 새 코드에서는 설정값을 사용할 것. */
export const NEAR_MISS_ALERT_THRESHOLD = 50;

export const REPORT_STATUS_ORDER = ["미분류", "분석중", "조치완료"] as const;

// 인적 오류 유형(도넛 차트)용 카테고리 컬러.
// 신호등 컬러(safety-*)는 "심각도/상태"만을 의미하도록 예약하고,
// 분류축이 다른 이 차트에는 별도의 구분 컬러를 사용한다.
// 키는 lib/types.ts의 HumanErrorType 값(실수/망각/착오/위반)과 정확히 일치해야 한다.
export const HUMAN_ERROR_COLORS: Record<HumanErrorType, string> = {
  실수: "#38BDF8", // sky - 즉흥적/신체적 오류 (Slip)
  망각: "#9AA3AB", // steel-light - 기억/주의 누락 (Lapse)
  착오: "#A78BFA", // violet - 판단/계획 오류 (Mistake)
  위반: "#FFC107", // 규정 위반, 의도적 일탈이므로 경고색 사용 (Violation)
};
