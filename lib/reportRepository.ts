import { randomUUID } from "node:crypto";
import { db } from "./db";
import {
  NearMissReport,
  ContributingFactor,
  HumanErrorType,
  ReportStatus,
  Severity,
} from "./types";
import { DUMMY_REPORTS } from "./dummyData";

/**
 * DB 접근은 이 파일을 통해서만 이루어진다 (Repository 패턴).
 * API 라우트나 다른 서버 코드는 better-sqlite3를 직접 다루지 않고
 * 여기서 내보내는 함수만 사용한다 → DB 종류를 바꾸더라도 이 파일만 교체하면 된다.
 */

// DB에 저장되는 원본 행(row) 형태 (snake_case)
interface ReportRow {
  id: string;
  created_at: string;
  zone_id: string;
  reporter_alias: string;
  transcript: string;
  photo_attached: number;
  severity: Severity;
  status: ReportStatus;
  human_error_type: HumanErrorType | null;
  contributing_factors: string; // JSON 문자열로 저장된 배열
}

function rowToReport(row: ReportRow): NearMissReport {
  return {
    id: row.id,
    createdAt: row.created_at,
    zoneId: row.zone_id,
    reporterAlias: row.reporter_alias,
    transcript: row.transcript,
    photoAttached: Boolean(row.photo_attached),
    severity: row.severity,
    status: row.status,
    humanErrorType: row.human_error_type ?? undefined,
    contributingFactors: JSON.parse(row.contributing_factors) as ContributingFactor[],
  };
}

const insertStatement = db.prepare(
  `INSERT INTO reports
    (id, created_at, zone_id, reporter_alias, transcript, photo_attached, severity, status, human_error_type, contributing_factors)
   VALUES (@id, @createdAt, @zoneId, @reporterAlias, @transcript, @photoAttached, @severity, @status, @humanErrorType, @contributingFactors)`
);

function insertReportRow(report: NearMissReport): void {
  insertStatement.run({
    id: report.id,
    createdAt: report.createdAt,
    zoneId: report.zoneId,
    reporterAlias: report.reporterAlias,
    transcript: report.transcript,
    photoAttached: report.photoAttached ? 1 : 0,
    severity: report.severity,
    status: report.status,
    humanErrorType: report.humanErrorType ?? null,
    contributingFactors: JSON.stringify(report.contributingFactors),
  });
}

/** scripts/seed.ts 및 자동 시드 양쪽에서 재사용하는 대량 삽입 함수 */
export function bulkInsertReports(reports: NearMissReport[]): void {
  const insertMany = db.transaction((rows: NearMissReport[]) => {
    for (const r of rows) insertReportRow(r);
  });
  insertMany(reports);
}

/**
 * 배포 환경에서는 서버가 재시작될 때마다 DB 파일이 새로 생성될 수 있다
 * (data.ts의 임시 폴더 폴백 참고). 그럴 때 대시보드가 완전히 빈 화면으로
 * 시작하지 않도록, 테이블이 비어있으면 첫 조회/등록 시점에 자동으로
 * 더미 데이터를 채워 넣는다. 로컬 개발에서는 npm run db:seed로 채운 뒤라면
 * 이미 데이터가 있으므로 아무 동작도 하지 않는다.
 */
function ensureSeeded(): void {
  if (countReports() === 0) {
    bulkInsertReports(DUMMY_REPORTS);
  }
}

/** 전체 리포트를 최신순으로 조회 */
export function getAllReports(): NearMissReport[] {
  ensureSeeded();
  const rows = db
    .prepare<[], ReportRow>("SELECT * FROM reports ORDER BY created_at DESC")
    .all();
  return rows.map(rowToReport);
}

export function getReportById(id: string): NearMissReport | null {
  const row = db
    .prepare<[string], ReportRow>("SELECT * FROM reports WHERE id = ?")
    .get(id);
  return row ? rowToReport(row) : null;
}

export interface NewReportInput {
  zoneId: string;
  transcript: string;
  reporterAlias?: string;
  photoAttached?: boolean;
  severity?: Severity;
}

/** 작업자 리포팅 화면에서 접수된 새 아차사고를 저장한다 */
export function createReport(input: NewReportInput): NearMissReport {
  ensureSeeded();

  const report: NearMissReport = {
    id: `NM-${randomUUID().slice(0, 8).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    zoneId: input.zoneId,
    reporterAlias: input.reporterAlias ?? "현장 작업자",
    transcript: input.transcript,
    photoAttached: input.photoAttached ?? false,
    severity: input.severity ?? "medium",
    status: "미분류",
    humanErrorType: undefined,
    contributingFactors: [],
  };

  insertReportRow(report);

  return report;
}

export interface ReportPatch {
  status?: ReportStatus;
  humanErrorType?: HumanErrorType;
  contributingFactors?: ContributingFactor[];
}

/** 관리자 대시보드에서의 태깅/상태 변경(조치완료 토글 포함)을 저장한다 */
export function updateReport(id: string, patch: ReportPatch): NearMissReport | null {
  const existing = getReportById(id);
  if (!existing) return null;

  const merged: NearMissReport = {
    ...existing,
    status: patch.status ?? existing.status,
    humanErrorType: patch.humanErrorType ?? existing.humanErrorType,
    contributingFactors: patch.contributingFactors ?? existing.contributingFactors,
  };

  db.prepare(
    `UPDATE reports
     SET status = @status,
         human_error_type = @humanErrorType,
         contributing_factors = @contributingFactors
     WHERE id = @id`
  ).run({
    id,
    status: merged.status,
    humanErrorType: merged.humanErrorType ?? null,
    contributingFactors: JSON.stringify(merged.contributingFactors),
  });

  return merged;
}

export function countReports(): number {
  const row = db.prepare<[], { count: number }>("SELECT COUNT(*) as count FROM reports").get();
  return row?.count ?? 0;
}

/** 시드 스크립트 전용: 전체 삭제 후 초기화 */
export function clearAllReports(): void {
  db.exec("DELETE FROM reports");
}
