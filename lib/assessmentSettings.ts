/**
 * ============================================================
 * 사업장별 평가 기준값
 *
 * 위험성평가의 판정 경계는 **표준으로 정해진 수치가 아니다.**
 * KOSHA 위험성평가 지침도 "빈도를 3단계로 나누라"까지만 규정하고,
 * 그 경계를 어디에 그을지는 사업장 재량으로 둔다.
 *
 * 근로자 수, 운영 기간, 업종 위험도에 따라 적정값이 달라지므로
 * 코드 상수가 아니라 설정값으로 관리한다.
 *
 * 실제 도입 시에는
 *   1) 과거 1~2년 자기 사업장 데이터로 분포를 확인해 경계를 정하고
 *   2) 산업안전보건위원회 심의를 거쳐 확정하며
 *   3) 운영하면서 "너무 많이 걸린다 / 전혀 안 걸린다" 싶으면 조정한다.
 * 한 번 정하고 끝나는 값이 아니라 운영하며 다듬는 값이다.
 * ============================================================
 */

export interface AssessmentSettings {
  /** 아차사고 누적 건수가 이 값에 도달하면 임계점 경보가 점등된다 */
  alertThreshold: number;
  /** 가능성 '상'(3점)으로 판정하기 위한 구역별 최소 신고 건수 */
  minForFrequent: number;
  /** 가능성 '중'(2점)으로 판정하기 위한 구역별 최소 신고 건수 */
  minForOccasional: number;
}

/**
 * 기본값 — 소규모 사업장(근로자 50인 내외) 기준으로 잡았다.
 *
 * 상대 기준(전체 구역 평균 대비)만 쓰면 데이터가 적을 때 신고 1건이 평균의 9배가
 * 되어 "빈번"으로 판정되는 문제가 있다. 그래서 절대 최소 건수를 함께 요구한다.
 * 규모가 큰 사업장에서는 3건이 노이즈에 가까우므로 상향해야 한다.
 */
export const DEFAULT_ASSESSMENT_SETTINGS: AssessmentSettings = {
  alertThreshold: 50,
  minForFrequent: 3,
  minForOccasional: 2,
};

/** 설정값이 서로 모순되지 않는지 검사한다. 문제가 있으면 메시지를, 없으면 null을 반환. */
export function validateSettings(s: AssessmentSettings): string | null {
  const ints = [s.alertThreshold, s.minForFrequent, s.minForOccasional];
  if (ints.some((v) => !Number.isInteger(v) || v < 1)) {
    return "모든 기준값은 1 이상의 정수여야 합니다.";
  }
  if (s.alertThreshold > 100000) {
    return "임계점이 너무 큽니다.";
  }
  if (s.minForFrequent > 1000 || s.minForOccasional > 1000) {
    return "최소 건수가 너무 큽니다.";
  }
  // '상' 기준이 '중'보다 낮으면 등급이 역전되어 판정이 무의미해진다.
  if (s.minForFrequent < s.minForOccasional) {
    return "'상' 최소 건수는 '중' 최소 건수보다 크거나 같아야 합니다.";
  }
  return null;
}

/** 근로자 규모별 권장값 — 화면에서 참고용으로 보여준다 */
export const SIZE_PRESETS: {
  label: string;
  description: string;
  settings: AssessmentSettings;
}[] = [
  {
    label: "소규모",
    description: "근로자 50인 미만",
    settings: { alertThreshold: 30, minForFrequent: 2, minForOccasional: 2 },
  },
  {
    label: "중규모",
    description: "50~300인",
    settings: { alertThreshold: 50, minForFrequent: 3, minForOccasional: 2 },
  },
  {
    label: "대규모",
    description: "300인 이상",
    settings: { alertThreshold: 150, minForFrequent: 10, minForOccasional: 5 },
  },
];
