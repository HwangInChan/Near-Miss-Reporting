import { NearMissReport, HumanErrorType, Severity, ContributingFactor, ReportStatus } from "./types";
import { FACTORY_ZONES } from "./constants";
import { mulberry32 } from "./utils";

/**
 * 더미 데이터는 seed 고정 PRNG로 생성한다.
 * → SSR(서버 렌더링)과 CSR(클라이언트 하이드레이션)에서 항상 동일한 결과가 나와야
 *   Next.js 하이드레이션 불일치 경고 없이 안전하게 렌더링된다.
 */
const rand = mulberry32(20240517);

const HUMAN_ERROR_TYPES: HumanErrorType[] = ["실수", "망각", "착오", "위반"];
const SEVERITIES: Severity[] = ["low", "medium", "high"];
const ALL_FACTORS: ContributingFactor[] = [
  "조도 부족",
  "야간/교대조",
  "피로 누적",
  "소음",
  "작업 절차 미숙지",
  "보호구 미착용",
  "정리정돈 불량",
  "작업 압박(시간)",
];

const TRANSCRIPT_SAMPLES = [
  "지게차가 후진하는데 경적이 들리지 않아 급하게 피했습니다.",
  "바닥에 흘린 기름 때문에 미끄러질 뻔했습니다.",
  "고소 작업대 난간 고정핀이 헐거워져 있었습니다.",
  "적재물이 한쪽으로 쏠려서 넘어질 뻔했습니다.",
  "비상정지 버튼 앞에 자재가 쌓여 있어 접근이 어려웠습니다.",
  "보호안경 없이 절단 작업을 하는 동료를 목격했습니다.",
  "통로에 케이블이 그대로 노출되어 발이 걸릴 뻔했습니다.",
  "야간 교대 중 조명이 꺼져 있어 시야 확보가 안 됐습니다.",
  "컨베이어 벨트 비상정지줄이 손이 닿지 않는 위치에 있었습니다.",
  "프레스 작업 중 손이 위험구역에 순간적으로 들어갔습니다.",
  "환기가 안 되어 도장 부스에서 어지러움을 느꼈습니다.",
  "계단 손잡이가 헐거워 잡았다가 순간 휘청였습니다.",
];

const REPORTER_ALIASES = [
  "1조 · 작업자 A",
  "1조 · 작업자 B",
  "2조 · 작업자 C",
  "2조 · 작업자 D",
  "3조(야간) · 작업자 E",
  "3조(야간) · 작업자 F",
  "협력사 · 작업자 G",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

function pickMany<T>(arr: T[], max: number): T[] {
  const n = Math.floor(rand() * (max + 1));
  const shuffled = [...arr].sort(() => rand() - 0.5);
  return shuffled.slice(0, n);
}

export function generateReports(count: number): NearMissReport[] {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => {
    const zone = pick(FACTORY_ZONES);
    const severity = pick(SEVERITIES);
    const isClassified = rand() > 0.35;
    const daysAgo = rand() * 30;

    return {
      id: `NM-${String(count - i).padStart(4, "0")}`,
      createdAt: new Date(now - daysAgo * 86400000).toISOString(),
      zoneId: zone.id,
      reporterAlias: pick(REPORTER_ALIASES),
      transcript: pick(TRANSCRIPT_SAMPLES),
      photoAttached: rand() > 0.4,
      severity,
      status: (isClassified ? (rand() > 0.5 ? "조치완료" : "분석중") : "미분류") as ReportStatus,
      humanErrorType: isClassified ? pick(HUMAN_ERROR_TYPES) : undefined,
      contributingFactors: isClassified ? pickMany(ALL_FACTORS, 3) : [],
    };
  }).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

// DB 시드 스크립트(scripts/seed.ts) 전용 더미 리포트.
// 90건으로 시작해, 작업자 화면에서 신규 제출이 쌓이며 150건 임계치에
// 점점 다가가는 과정을 데모에서 보여줄 수 있도록 여유를 남겨둔다.
export const DUMMY_REPORTS: NearMissReport[] = generateReports(90);
