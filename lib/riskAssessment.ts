import { NearMissReport, ContributingFactor, HumanErrorType } from "./types";
import { FACTORY_ZONES } from "./constants";
import {
  AssessmentSettings,
  DEFAULT_ASSESSMENT_SETTINGS,
} from "./assessmentSettings";

/**
 * ============================================================
 * 위험성평가(Risk Assessment) 기반 개선 우선순위 도출
 *
 * 산업안전보건법 제36조 및 KOSHA 위험성평가 지침의 기본 구조를 따른다.
 *
 *   위험성(Risk) = 가능성(빈도, Likelihood) × 중대성(강도, Severity)
 *
 * 3×3 매트릭스를 사용해 위험성 점수를 1~9로 산출하고, 점수대별로
 * 허용/개선/즉시개선 등급을 판정한다. (곱의 특성상 5·7·8은 나오지 않는다)
 *
 * 이 앱의 차별점은 가능성과 중대성을 담당자의 주관적 추정이 아니라
 * **실제 접수된 아차사고 데이터에서 산출**한다는 점이다. 전통적 위험성평가는
 * 평가자의 경험에 의존해 편차가 크다는 한계가 지적되어 왔다.
 * ============================================================
 */

export type RiskGrade = "높음" | "보통" | "낮음";

/** 위험성 감소대책의 우선순위 (Hierarchy of Controls).
 *  숫자가 작을수록 근본적이고 효과가 크다. 개인보호구는 항상 최후의 수단이다. */
export type ControlLevel = "본질적" | "공학적" | "관리적" | "보호구";

export const CONTROL_LEVEL_ORDER: Record<ControlLevel, number> = {
  본질적: 1,
  공학적: 2,
  관리적: 3,
  보호구: 4,
};

export interface ControlMeasure {
  level: ControlLevel;
  action: string;
}

export interface ZoneRiskAssessment {
  zoneId: string;
  zoneLabel: string;
  reportCount: number;
  /** 가능성 점수 1(하) ~ 3(상) */
  likelihood: number;
  likelihoodLabel: string;
  /** 중대성 점수 1(소) ~ 3(대) */
  severity: number;
  severityLabel: string;
  /** 위험성 = 가능성 × 중대성 (1~9) */
  riskScore: number;
  grade: RiskGrade;
  /** 이 구역에서 가장 많이 태깅된 배후 요인 (많은 순) */
  dominantFactors: { factor: ContributingFactor; count: number }[];
  /** 지배적인 인적 오류 유형 (대책 성격 판단에 사용) */
  dominantErrorType?: HumanErrorType;
  /** 배후 요인에서 도출한 권고 대책 (근본적인 것부터) */
  measures: ControlMeasure[];
  /** 인적 오류 유형에 따른 접근 방향 조언 (화면용, 조언체) */
  errorTypeAdvice?: string;
  /** 같은 내용의 인쇄용 서술형 문구 (개선계획서에 실린다) */
  errorTypeNote?: string;
}

/**
 * 배후 요인별 표준 개선대책.
 *
 * 각 대책에 Hierarchy of Controls 단계를 붙였다. 같은 요인이라도
 * "보호구를 지급한다"보다 "위험원 자체를 줄인다"가 상위 대책이며,
 * 실무에서 흔한 오류가 관리적 대책·보호구에만 의존하는 것이다.
 */
const FACTOR_MEASURES: Record<string, ControlMeasure[]> = {
  "설비·방호장치 결함": [
    { level: "본질적", action: "위험 부위를 제거하거나 자동화하여 접촉 자체를 차단" },
    { level: "공학적", action: "방호덮개·인터록·양수조작식 기동장치 설치 및 작동 확인" },
    { level: "관리적", action: "설비 일상점검 체크리스트 운영, 결함 신고 즉시 사용중지 절차" },
  ],
  "작업 절차 미비·불명확": [
    { level: "관리적", action: "작업표준(SOP) 신규 제정 또는 모호한 기준 명확화 후 현장 게시" },
    { level: "관리적", action: "신규·전환 배치자 교육 및 이해도 확인 절차 도입" },
  ],
  "조도 부족": [
    { level: "공학적", action: "국소조명 증설 및 작업면 조도 측정 (KS A 3011 기준 확인)" },
    { level: "관리적", action: "조도 점검 주기 수립 및 등기구 교체 이력 관리" },
  ],
  소음: [
    { level: "본질적", action: "저소음 설비로 교체 또는 소음원 격리" },
    { level: "공학적", action: "방음 커버·차음벽 설치, 소음 측정 및 소음지도 작성" },
    { level: "보호구", action: "청력보호구 지급 및 착용 관리 (차음 성능 확인)" },
  ],
  "의사소통·신호 미흡": [
    { level: "공학적", action: "후진 경보음·경광등 등 시청각 경보장치 보강" },
    { level: "관리적", action: "유도자 배치 및 표준 수신호 규정 수립·교육" },
  ],
  "환기·유해물질": [
    { level: "본질적", action: "저유해성 물질로 대체 검토" },
    { level: "공학적", action: "국소배기장치 설치·성능 점검, 작업환경측정 실시" },
    { level: "보호구", action: "적합한 호흡보호구 지급 및 밀착도 확인" },
  ],
  "정리정돈·바닥 상태 불량": [
    { level: "공학적", action: "통로 구획선 재도색, 미끄럼 방지 처리, 케이블 트레이 설치" },
    { level: "관리적", action: "5S 활동 정례화, 누유·누수 즉시 처리 및 작업 종료 시 정리 점검" },
  ],
  "야간·교대 근무": [
    { level: "본질적", action: "야간 시간대 고위험 작업 자체를 주간으로 재배치" },
    { level: "관리적", action: "연속 야간근무 일수 제한 등 교대 스케줄 재설계" },
    { level: "관리적", action: "야간 시간대 순찰·감독 주기 단축" },
  ],
  "피로 누적": [
    { level: "본질적", action: "작업량 재산정 및 인력 재배치로 피로 유발 요인 제거" },
    { level: "관리적", action: "의무 휴게 주기 도입 및 연장근로 상한 관리" },
  ],
  "작업 압박(시간)": [
    { level: "본질적", action: "공정 리드타임 재설계로 시간 압박 요인 자체를 완화" },
    { level: "관리적", action: "긴급 작업 승인 절차 도입, 무리한 단축 지시 차단" },
  ],
  "보호구 미지급·불편": [
    { level: "공학적", action: "보호구가 필요 없도록 위험원 방호를 우선 검토" },
    { level: "보호구", action: "작업 지점 인근 비치로 접근성 개선, 착용감 개선 제품으로 교체" },
    { level: "관리적", action: "지급·착용 실태 점검 및 관리감독자 확인" },
  ],
};

/**
 * 인적 오류 유형에 따른 대책 접근 방향.
 * Reason의 분류에서 중요한 시사점은 "실수·망각은 교육으로 못 막는다"는 것이다.
 * 사람은 주의력만으로 Slip을 없앨 수 없으므로 공학적 방호가 필요하고,
 * 반대로 위반은 규정을 몰라서가 아니라 알면서 어기는 것이므로
 * 왜 지키기 어려운지(작업 여건)를 봐야 한다.
 */
const ERROR_TYPE_ADVICE: Record<HumanErrorType, string> = {
  실수: "주의력에 의존한 교육으로는 막기 어렵습니다. 잘못된 동작이 애초에 불가능하도록 공학적 방호(인터록, 방호덮개)를 우선 검토하세요.",
  망각: "절차를 기억에 의존시키지 마세요. 체크리스트, 시각적 표시, 강제 확인 단계를 공정에 삽입하는 것이 효과적입니다.",
  착오: "판단 자체가 틀린 경우이므로 작업표준의 명확성과 교육 내용을 재검토해야 합니다. 애매한 지시·기준이 없는지 확인하세요.",
  위반: "규정을 몰라서가 아니라 지키기 어려운 여건일 가능성이 큽니다. 처벌보다 왜 우회하게 되는지(시간 압박, 불편한 보호구)를 먼저 파악하세요.",
};

/**
 * 인쇄용 문구.
 *
 * 화면(ERROR_TYPE_ADVICE)은 시스템이 관리자에게 건네는 조언이므로 "~하세요"가 자연스럽다.
 * 그러나 개선계획서는 **안전관리자가 작성해 결재를 올리는 문서**다. 작성자가 자기
 * 문서에서 자신에게 지시받는 형식이 되면 어색하고, 결재자가 읽기에도 부적절하다.
 * 그래서 인쇄본은 판단을 기술하는 서술형(개조식)으로 따로 둔다.
 */
const ERROR_TYPE_NOTE: Record<HumanErrorType, string> = {
  실수: "주의력에 의존한 교육만으로는 재발 방지 효과를 기대하기 어려움. 잘못된 동작이 물리적으로 불가능하도록 인터록·방호덮개 등 공학적 방호 적용이 요구됨.",
  망각: "절차 이행을 기억에 의존시키지 않도록 체크리스트·시각적 표시·강제 확인 단계를 공정에 삽입할 필요가 있음.",
  착오: "판단 단계에서 발생한 오류로, 작업표준의 명확성 및 교육 내용에 대한 재검토가 필요함. 모호한 지시·기준의 존재 여부 확인 요망.",
  위반: "규정 인지 부족이 아닌 준수 곤란 여건에 기인할 가능성이 높음. 시간 압박, 보호구 불편 등 절차를 우회하게 만드는 요인의 우선 파악이 필요함.",
};

const GRADE_STYLE: Record<RiskGrade, { color: string; container: string; action: string }> = {
  높음: { color: "#E53935", container: "#7A1F1C", action: "즉시 개선 (작업 중지 검토)" },
  보통: { color: "#FFC107", container: "#7A5B00", action: "개선 계획 수립 필요" },
  낮음: { color: "#22C55E", container: "#14532D", action: "현 수준 유지·관리" },
};

export function gradeStyle(grade: RiskGrade) {
  return GRADE_STYLE[grade];
}

/** 위험성 점수 → 등급 판정 (KOSHA 3×3 매트릭스 기준) */
function toGrade(score: number): RiskGrade {
  if (score >= 6) return "높음";
  if (score >= 3) return "보통";
  return "낮음";
}

const LIKELIHOOD_LABEL = ["", "하 (드묾)", "중 (가끔)", "상 (빈번)"];
const SEVERITY_LABEL = ["", "소 (경미)", "중 (주의)", "대 (위험)"];

/**
 * 구역별 위험성평가를 수행한다.
 *
 * - 가능성: 해당 구역 신고 건수를 전체 구역 평균과 비교해 3단계로 환산한다.
 *   절대 건수 기준을 쓰면 사업장 규모·운영 기간에 따라 의미가 달라지므로
 *   상대 기준을 택했다.
 * - 중대성: 그 구역에서 **관측된 최대 심각도**를 사용한다. 평균이 아니다.
 *   위험성평가는 "예상되는 최악의 결과"로 중대성을 판단하며, 평균을 쓰면
 *   경미 사고 다수에 묻혀 중대재해 가능성이 희석되기 때문이다.
 */
export function assessZoneRisks(
  reports: NearMissReport[],
  settings: AssessmentSettings = DEFAULT_ASSESSMENT_SETTINGS
): ZoneRiskAssessment[] {
  const totalZones = FACTORY_ZONES.length;
  const average = reports.length / totalZones;

  return FACTORY_ZONES.map((zone) => {
    const zoneReports = reports.filter((r) => r.zoneId === zone.id);
    const count = zoneReports.length;

    // --- 가능성 (빈도) ---
    // 평균 대비 상대 기준을 쓰되, 절대 최소 건수 조건을 함께 건다.
    //
    // 상대 기준만 쓰면 데이터가 적을 때(예: 전체 1건) 그 1건이 평균의 9배가 되어
    // "빈번"으로 판정되는 통계적 불안정성이 생긴다. 아차사고 1건으로 반복성을
    // 주장할 수는 없으므로, 반복이라 부를 최소 횟수를 함께 요구한다.
    //
    // 이 최소 건수는 사업장 규모에 따라 달라야 하므로 설정값으로 받는다.
    // (소규모에서는 3건도 유의미하지만, 대규모에서는 노이즈에 가깝다)
    let likelihood = 1;
    if (count >= Math.max(average * 2, settings.minForFrequent)) likelihood = 3;
    else if (count >= Math.max(average, settings.minForOccasional)) likelihood = 2;

    // --- 중대성 (강도): 관측된 최대 심각도 ---
    let severity = 1;
    if (zoneReports.some((r) => r.severity === "high")) severity = 3;
    else if (zoneReports.some((r) => r.severity === "medium")) severity = 2;

    const riskScore = count === 0 ? 0 : likelihood * severity;

    // --- 배후 요인 집계 ---
    const factorCounter = new Map<ContributingFactor, number>();
    zoneReports.forEach((r) =>
      r.contributingFactors.forEach((f) =>
        factorCounter.set(f, (factorCounter.get(f) ?? 0) + 1)
      )
    );
    const dominantFactors = Array.from(factorCounter.entries())
      .map(([factor, c]) => ({ factor, count: c }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    // --- 인적 오류 유형 ---
    const errorCounter = new Map<HumanErrorType, number>();
    zoneReports.forEach((r) => {
      if (r.humanErrorType) {
        errorCounter.set(r.humanErrorType, (errorCounter.get(r.humanErrorType) ?? 0) + 1);
      }
    });
    const dominantErrorType = Array.from(errorCounter.entries()).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0];

    // --- 권고 대책: 지배적 요인에서 도출, 근본적인 것부터 정렬 ---
    const measures: ControlMeasure[] = [];
    const seen = new Set<string>();
    dominantFactors.forEach(({ factor }) => {
      FACTOR_MEASURES[factor]?.forEach((m) => {
        if (!seen.has(m.action)) {
          seen.add(m.action);
          measures.push(m);
        }
      });
    });
    measures.sort(
      (a, b) => CONTROL_LEVEL_ORDER[a.level] - CONTROL_LEVEL_ORDER[b.level]
    );

    return {
      zoneId: zone.id,
      zoneLabel: zone.label,
      reportCount: count,
      likelihood,
      likelihoodLabel: LIKELIHOOD_LABEL[likelihood],
      severity,
      severityLabel: SEVERITY_LABEL[severity],
      riskScore,
      grade: toGrade(riskScore),
      dominantFactors,
      dominantErrorType,
      measures: measures.slice(0, 4),
      errorTypeAdvice: dominantErrorType ? ERROR_TYPE_ADVICE[dominantErrorType] : undefined,
      errorTypeNote: dominantErrorType ? ERROR_TYPE_NOTE[dominantErrorType] : undefined,
    };
  });
}

/** 위험성이 높은 순으로 정렬한 개선 우선순위 목록 (신고가 없는 구역은 제외) */
export function prioritizeZones(assessments: ZoneRiskAssessment[]): ZoneRiskAssessment[] {
  return assessments
    .filter((a) => a.reportCount > 0)
    .sort((a, b) => b.riskScore - a.riskScore || b.reportCount - a.reportCount);
}
