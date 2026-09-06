/**
 * 도메인 전역에서 사용하는 타입 정의.
 * 컴포넌트/유틸/더미데이터 모두 이 파일을 단일 진실 공급원(SSOT)으로 참조한다.
 */

// 인적 오류 분류 (Human Error Taxonomy - Rasmussen/Reason 기반)
// DB 저장값이자 색상 매핑(HUMAN_ERROR_COLORS) 키로도 쓰이는 내부 식별자.
// 원래 Slip/Lapse/Mistake/Violation(영어)였으나, 화면 표시와 내부 값을
// 이원화하지 않고 하나로 통일하기 위해 한글 값 자체를 식별자로 사용한다.
export type HumanErrorType = "실수" | "망각" | "착오" | "위반";

export const HUMAN_ERROR_TYPES: HumanErrorType[] = [
  "실수",
  "망각",
  "착오",
  "위반",
];

// 배후 요인 (Contributing / Latent Factors)
export type ContributingFactor =
  | "조도 부족"
  | "야간/교대조"
  | "피로 누적"
  | "소음"
  | "작업 절차 미숙지"
  | "보호구 미착용"
  | "정리정돈 불량"
  | "작업 압박(시간)";

export const CONTRIBUTING_FACTORS: ContributingFactor[] = [
  "조도 부족",
  "야간/교대조",
  "피로 누적",
  "소음",
  "작업 절차 미숙지",
  "보호구 미착용",
  "정리정돈 불량",
  "작업 압박(시간)",
];

// 처리 상태
export type ReportStatus = "미분류" | "분석중" | "조치완료";

// 심각도 (신호등 컬러와 매핑됨)
export type Severity = "low" | "medium" | "high";

// 공장 구역
export interface FactoryZone {
  id: string;
  label: string;
  gridX: number; // 히트맵 격자 좌표 (0-index)
  gridY: number;
}

// 아차사고 리포트 1건
export interface NearMissReport {
  id: string;
  createdAt: string; // ISO string
  zoneId: string;
  reporterAlias: string; // 작업자 익명 표시명 (예: "3교대 · 작업자 A")
  transcript: string; // 음성 인식 결과(모사) 텍스트
  photoAttached: boolean;
  severity: Severity;
  status: ReportStatus;
  humanErrorType?: HumanErrorType;
  contributingFactors: ContributingFactor[];
  /** 신고자 사번. 익명 신고이거나 사번 도입 이전 데이터면 undefined. */
  employeeId?: string;
  /** 익명 신고 여부. true면 포상 집계에서 제외된다. */
  isAnonymous: boolean;
  /** 관리자가 "중대재해를 예방한 우수 신고"로 표시했는지 (질적 포상용). */
  isExemplary: boolean;
}

// 등록된 작업자 (사번 + 이름)
export interface Worker {
  employeeId: string;
  name: string;
  createdAt: string;
}

/**
 * 포상 집계 결과 1인분.
 * 익명 신고는 employeeId가 없으므로 애초에 이 집계에 포함되지 않는다.
 */
export interface RewardRanking {
  employeeId: string;
  name: string;
  totalCount: number; // 기명 신고 총 건수
  exemplaryCount: number; // 그중 우수 신고로 선정된 건수
  resolvedCount: number; // 그중 조치완료까지 이어진 건수
}

// 히트맵 셀 집계 데이터
export interface HeatmapCell {
  zoneId: string;
  zoneLabel: string;
  gridX: number;
  gridY: number;
  count: number;
}
