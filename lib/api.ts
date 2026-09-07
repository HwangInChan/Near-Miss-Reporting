import {
  ContributingFactor,
  HumanErrorType,
  NearMissReport,
  RewardRanking,
  Severity,
  Worker,
} from "./types";

/**
 * ============================================================
 * API 클라이언트 (브라우저 → 서버)
 *
 * 화면 컴포넌트는 fetch를 직접 쓰지 않고 이 파일의 함수만 호출한다.
 * 엔드포인트 경로나 응답 형태가 바뀌어도 여기만 고치면 된다.
 * ============================================================
 */

export interface CreateReportPayload {
  zoneId: string;
  transcript: string;
  /** 압축된 이미지 data URL. compressImage()의 결과를 그대로 넣는다. */
  photoDataUrl?: string;
  employeeId?: string;
  /** 서버에 사번이 없을 때 자동 등록하기 위한 이름 */
  employeeName?: string;
  isAnonymous?: boolean;
}

export interface UpdateReportPayload {
  status?: NearMissReport["status"];
  humanErrorType?: HumanErrorType;
  contributingFactors?: ContributingFactor[];
  isExemplary?: boolean;
  severity?: Severity;
}

export interface PhotoStorageUsage {
  count: number;
  totalBytes: number;
}

async function parseJsonOrThrow(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error ?? `요청이 실패했습니다 (${response.status})`);
  }
  return data;
}

/* ---------- 리포트 ---------- */

export async function fetchReports(): Promise<NearMissReport[]> {
  const res = await fetch("/api/reports", { cache: "no-store" });
  const data = await parseJsonOrThrow(res);
  return data.reports as NearMissReport[];
}

/** 내가 낸 기명 신고 이력만 조회 */
export async function fetchMyReports(employeeId: string): Promise<NearMissReport[]> {
  const res = await fetch(`/api/reports?employeeId=${encodeURIComponent(employeeId)}`, {
    cache: "no-store",
  });
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

/* ---------- 작업자 / 포상 ---------- */

export async function registerWorkerApi(employeeId: string, name: string): Promise<Worker> {
  const res = await fetch("/api/workers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ employeeId, name }),
  });
  const data = await parseJsonOrThrow(res);
  return data.worker as Worker;
}

export async function fetchRewardRankings(): Promise<RewardRanking[]> {
  const res = await fetch("/api/rankings", { cache: "no-store" });
  const data = await parseJsonOrThrow(res);
  return data.rankings as RewardRanking[];
}

/* ---------- 통계 ---------- */

export async function fetchFactorStats(): Promise<{ factor: string; count: number }[]> {
  const res = await fetch("/api/factor-stats", { cache: "no-store" });
  const data = await parseJsonOrThrow(res);
  return data.stats as { factor: string; count: number }[];
}

/** 첨부 사진이 차지하는 저장 용량 */
export async function fetchPhotoUsage(): Promise<PhotoStorageUsage> {
  const res = await fetch("/api/storage-usage", { cache: "no-store" });
  const data = await parseJsonOrThrow(res);
  return data.usage as PhotoStorageUsage;
}
