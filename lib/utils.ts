import {
  ContributingFactor,
  HeatmapCell,
  HumanErrorType,
  NearMissReport,
  Severity,
} from "./types";
import { FACTORY_ZONES, HEINRICH_RATIO, SEVERITY_COLOR } from "./constants";

/**
 * ============================================================
 * 공통 유틸 모음
 * 프로젝트 전역에서 재사용하는 함수는 이 파일 하나에만 정의한다.
 * (컴포넌트별로 흩어지는 것을 방지 → 유지보수 포인트 단일화)
 * ============================================================
 */

// ---------- className 유틸 ----------
// 외부 라이브러리(clsx 등) 없이 동작하는 가벼운 자체 구현.
// 조건부 클래스: cn("base", isActive && "active", ["a", "b"])
type ClassInput = string | false | null | undefined | ClassInput[];
export function cn(...inputs: ClassInput[]): string {
  return inputs.flat(Infinity as 1).filter(Boolean).join(" ");
}

// ---------- 결정론적(seed 고정) 난수 생성기 ----------
// Math.random()은 SSR/CSR 간 하이드레이션 불일치를 유발하므로
// 더미데이터 생성에는 항상 seed 고정 PRNG를 사용한다.
export function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- 날짜/시간 포맷 ----------
export function formatRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}일 전`;
}

export function formatDateTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------- 심각도 관련 ----------
export function severityLabel(s: Severity): string {
  return SEVERITY_COLOR[s].label;
}

export function severityTextColor(s: Severity): string {
  return SEVERITY_COLOR[s].text;
}

// ---------- 집계 함수 ----------

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

/** 배후 요인별 건수 집계 (막대/체크박스 통계용) */
export function countByContributingFactor(
  reports: NearMissReport[]
): { factor: ContributingFactor; count: number }[] {
  const counter = new Map<ContributingFactor, number>();
  reports.forEach((r) =>
    r.contributingFactors.forEach((f) =>
      counter.set(f, (counter.get(f) ?? 0) + 1)
    )
  );
  return Array.from(counter.entries())
    .map(([factor, count]) => ({ factor, count }))
    .sort((a, b) => b.count - a.count);
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

// ---------- API 클라이언트 (브라우저 → /api/reports) ----------
// 작업자 화면(ReportForm)과 관리자 대시보드(DashboardClient)가 공통으로 사용하는
// fetch 래퍼. 두 화면 모두 이 함수들을 통해서만 서버(DB)와 통신한다.

export interface CreateReportPayload {
  zoneId: string;
  transcript: string;
  photoAttached?: boolean;
}

export interface UpdateReportPayload {
  status?: NearMissReport["status"];
  humanErrorType?: HumanErrorType;
  contributingFactors?: ContributingFactor[];
}

async function parseJsonOrThrow(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error ?? `요청이 실패했습니다 (${response.status})`);
  }
  return data;
}

export async function fetchReports(): Promise<NearMissReport[]> {
  const res = await fetch("/api/reports", { cache: "no-store" });
  const data = await parseJsonOrThrow(res);
  return data.reports as NearMissReport[];
}

export async function submitReport(payload: CreateReportPayload): Promise<NearMissReport> {
  const res = await fetch("/api/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseJsonOrThrow(res);
  return data.report as NearMissReport;
}

export async function patchReport(
  id: string,
  payload: UpdateReportPayload
): Promise<NearMissReport> {
  const res = await fetch(`/api/reports/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await parseJsonOrThrow(res);
  return data.report as NearMissReport;
}

/**
 * 관리자 대시보드의 "조치완료" 토글 로직.
 * 미분류/분석중 상태에서 누르면 조치완료로, 조치완료 상태에서 다시 누르면
 * 분석중으로 되돌린다 (번복).
 */
export function toggleResolvedStatus(current: NearMissReport["status"]): NearMissReport["status"] {
  return current === "조치완료" ? "분석중" : "조치완료";
}
