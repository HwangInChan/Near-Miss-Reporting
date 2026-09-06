import { randomUUID } from "node:crypto";
import { getDb } from "./db";
import {
  NearMissReport,
  ContributingFactor,
  HumanErrorType,
  ReportStatus,
  RewardRanking,
  Severity,
  Worker,
} from "./types";
import { DUMMY_REPORTS, DUMMY_WORKERS } from "./dummyData";

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
  employee_id: string | null;
  is_anonymous: number;
  is_exemplary: number;
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
    employeeId: row.employee_id ?? undefined,
    isAnonymous: Boolean(row.is_anonymous),
    isExemplary: Boolean(row.is_exemplary),
  };
}

function insertReportRow(report: NearMissReport): void {
  // prepared statement를 모듈 최상위가 아니라 여기서 만든다.
  // (최상위에서 만들면 import만 해도 DB 파일이 열려 빌드 중 충돌이 난다)
  getDb().prepare(
    `INSERT INTO reports
      (id, created_at, zone_id, reporter_alias, transcript, photo_attached, severity, status,
       human_error_type, contributing_factors, employee_id, is_anonymous, is_exemplary)
     VALUES (@id, @createdAt, @zoneId, @reporterAlias, @transcript, @photoAttached, @severity, @status,
       @humanErrorType, @contributingFactors, @employeeId, @isAnonymous, @isExemplary)`
  ).run({
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
    employeeId: report.employeeId ?? null,
    isAnonymous: report.isAnonymous ? 1 : 0,
    isExemplary: report.isExemplary ? 1 : 0,
  });
}

/** scripts/seed.ts 및 자동 시드 양쪽에서 재사용하는 대량 삽입 함수 */
export function bulkInsertReports(reports: NearMissReport[]): void {
  const insertMany = getDb().transaction((rows: NearMissReport[]) => {
    for (const r of rows) insertReportRow(r);
  });
  insertMany(reports);
}

/**
 * 배포 환경에서는 서버가 재시작될 때마다 DB 파일이 새로 생성될 수 있다
 * (db.ts의 임시 폴더 폴백 참고). 그럴 때 대시보드가 완전히 빈 화면으로
 * 시작하지 않도록, 테이블이 비어있으면 첫 조회/등록 시점에 자동으로
 * 더미 데이터를 채워 넣는다. 로컬 개발에서는 npm run db:seed로 채운 뒤라면
 * 이미 데이터가 있으므로 아무 동작도 하지 않는다.
 */
function ensureSeeded(): void {
  if (countReports() === 0) {
    // 리포트가 참조하는 작업자를 먼저 등록해야 포상 집계(JOIN)가 성립한다.
    for (const w of DUMMY_WORKERS) {
      registerWorker(w.employeeId, w.name);
    }
    bulkInsertReports(DUMMY_REPORTS);
  }
}

/** 전체 리포트를 최신순으로 조회 */
export function getAllReports(): NearMissReport[] {
  ensureSeeded();
  const rows = getDb()
    .prepare<[], ReportRow>("SELECT * FROM reports ORDER BY created_at DESC")
    .all();
  return rows.map(rowToReport);
}

/** 특정 작업자가 낸 기명 신고만 최신순으로 조회 (내 신고 이력용) */
export function getReportsByEmployee(employeeId: string): NearMissReport[] {
  ensureSeeded();
  const rows = getDb()
    .prepare<[string], ReportRow>(
      "SELECT * FROM reports WHERE employee_id = ? ORDER BY created_at DESC"
    )
    .all(employeeId);
  return rows.map(rowToReport);
}

export function getReportById(id: string): NearMissReport | null {
  const row = getDb()
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
  employeeId?: string;
  isAnonymous?: boolean;
}

/** 작업자 리포팅 화면에서 접수된 새 아차사고를 저장한다 */
export function createReport(input: NewReportInput): NearMissReport {
  ensureSeeded();

  const isAnonymous = input.isAnonymous ?? false;
  // 익명 신고는 사번을 아예 저장하지 않는다. 그래야 나중에 실수로라도
  // 역추적되지 않고, 포상 집계(employee_id 기준)에서도 자연히 빠진다.
  const employeeId = isAnonymous ? undefined : input.employeeId;

  const worker = employeeId ? getWorker(employeeId) : null;
  const alias = isAnonymous
    ? "익명 신고"
    : worker
      ? `${worker.name} (${worker.employeeId})`
      : (input.reporterAlias ?? "현장 작업자");

  const report: NearMissReport = {
    id: `NM-${randomUUID().slice(0, 8).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    zoneId: input.zoneId,
    reporterAlias: alias,
    transcript: input.transcript,
    photoAttached: input.photoAttached ?? false,
    severity: input.severity ?? "medium",
    status: "미분류",
    humanErrorType: undefined,
    contributingFactors: [],
    employeeId,
    isAnonymous,
    isExemplary: false,
  };

  insertReportRow(report);

  return report;
}

export interface ReportPatch {
  status?: ReportStatus;
  humanErrorType?: HumanErrorType;
  contributingFactors?: ContributingFactor[];
  isExemplary?: boolean;
  /** 접수 시점에는 심각도를 알 수 없어 medium으로 저장되므로,
   *  관리자가 내용을 확인한 뒤 조정할 수 있어야 한다. */
  severity?: Severity;
}

/** 관리자 대시보드에서의 태깅/상태 변경(조치완료 토글, 우수신고 지정 포함)을 저장한다 */
export function updateReport(id: string, patch: ReportPatch): NearMissReport | null {
  const existing = getReportById(id);
  if (!existing) return null;

  const merged: NearMissReport = {
    ...existing,
    status: patch.status ?? existing.status,
    humanErrorType: patch.humanErrorType ?? existing.humanErrorType,
    contributingFactors: patch.contributingFactors ?? existing.contributingFactors,
    isExemplary: patch.isExemplary ?? existing.isExemplary,
    severity: patch.severity ?? existing.severity,
  };

  getDb().prepare(
    `UPDATE reports
     SET status = @status,
         human_error_type = @humanErrorType,
         contributing_factors = @contributingFactors,
         is_exemplary = @isExemplary,
         severity = @severity
     WHERE id = @id`
  ).run({
    id,
    status: merged.status,
    humanErrorType: merged.humanErrorType ?? null,
    contributingFactors: JSON.stringify(merged.contributingFactors),
    isExemplary: merged.isExemplary ? 1 : 0,
    severity: merged.severity,
  });

  return merged;
}

export function countReports(): number {
  const row = getDb().prepare<[], { count: number }>("SELECT COUNT(*) as count FROM reports").get();
  return row?.count ?? 0;
}

/** 시드 스크립트 전용: 전체 삭제 후 초기화 */
export function clearAllReports(): void {
  getDb().exec("DELETE FROM reports");
}

/* ============================================================
 * 작업자(사번) 관련
 * ============================================================ */

interface WorkerRow {
  employee_id: string;
  name: string;
  created_at: string;
}

function rowToWorker(row: WorkerRow): Worker {
  return {
    employeeId: row.employee_id,
    name: row.name,
    createdAt: row.created_at,
  };
}

export function getWorker(employeeId: string): Worker | null {
  const row = getDb()
    .prepare<[string], WorkerRow>("SELECT * FROM workers WHERE employee_id = ?")
    .get(employeeId);
  return row ? rowToWorker(row) : null;
}

/**
 * 작업자를 등록하거나, 이미 등록된 사번이면 기존 정보를 돌려준다.
 * 같은 사번으로 다른 이름을 보내면 이름을 갱신한다 (오타 수정 등).
 */
export function registerWorker(employeeId: string, name: string): Worker {
  const existing = getWorker(employeeId);

  if (existing) {
    if (existing.name !== name) {
      getDb().prepare("UPDATE workers SET name = ? WHERE employee_id = ?").run(name, employeeId);
      return { ...existing, name };
    }
    return existing;
  }

  const worker: Worker = {
    employeeId,
    name,
    createdAt: new Date().toISOString(),
  };
  getDb().prepare(
    "INSERT INTO workers (employee_id, name, created_at) VALUES (?, ?, ?)"
  ).run(worker.employeeId, worker.name, worker.createdAt);

  return worker;
}

/**
 * 포상 집계 순위.
 * employee_id가 NULL인 행(익명 신고 및 사번 도입 이전 과거 데이터)은
 * JOIN 조건에서 자연스럽게 제외되므로, "익명 신고는 포상 대상에서 제외"가
 * 별도 처리 없이 구조적으로 보장된다.
 */
export function getRewardRankings(): RewardRanking[] {
  ensureSeeded();
  const rows = getDb()
    .prepare<[], {
      employee_id: string;
      name: string;
      total_count: number;
      exemplary_count: number;
      resolved_count: number;
    }>(
      `SELECT
         w.employee_id,
         w.name,
         COUNT(r.id) AS total_count,
         SUM(CASE WHEN r.is_exemplary = 1 THEN 1 ELSE 0 END) AS exemplary_count,
         SUM(CASE WHEN r.status = '조치완료' THEN 1 ELSE 0 END) AS resolved_count
       FROM workers w
       JOIN reports r ON r.employee_id = w.employee_id
       GROUP BY w.employee_id, w.name
       ORDER BY exemplary_count DESC, total_count DESC, w.name ASC`
    )
    .all();

  return rows.map((r) => ({
    employeeId: r.employee_id,
    name: r.name,
    totalCount: r.total_count,
    exemplaryCount: r.exemplary_count ?? 0,
    resolvedCount: r.resolved_count ?? 0,
  }));
}

/* ============================================================
 * 첨부 사진
 *
 * 이미지는 SQLite BLOB으로 DB 파일 안에 함께 저장한다.
 * 파일시스템에 따로 저장하지 않는 이유: 이 앱은 DB가 파일 하나(data/near-miss.db)로
 * 완결되는 구조이고, Render 무료 플랜처럼 컨테이너가 재시작되면 파일시스템이
 * 초기화되는 환경에서 "DB만 남고 이미지는 사라지는" 불일치가 생기는 것보다
 * 둘의 수명을 일치시키는 편이 낫다. 백업도 DB 파일 하나만 복사하면 된다.
 *
 * 대신 원본 사진을 그대로 넣으면 DB가 급격히 커지므로, 업로드 전 클라이언트에서
 * 리사이즈·압축한다(lib/utils.ts의 compressImage). 서버에서도 상한을 강제한다.
 * ============================================================ */

/** 서버가 받아들이는 사진 1장의 최대 크기 (압축 후 기준) */
export const MAX_PHOTO_BYTES = 1_500_000; // 1.5MB

export function savePhoto(reportId: string, mimeType: string, data: Buffer): void {
  getDb()
    .prepare(
      `INSERT INTO report_photos (report_id, mime_type, data, byte_size, created_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(report_id) DO UPDATE SET
         mime_type = excluded.mime_type,
         data = excluded.data,
         byte_size = excluded.byte_size,
         created_at = excluded.created_at`
    )
    .run(reportId, mimeType, data, data.byteLength, new Date().toISOString());
}

export function getPhoto(reportId: string): { mimeType: string; data: Buffer } | null {
  const row = getDb()
    .prepare<[string], { mime_type: string; data: Buffer }>(
      "SELECT mime_type, data FROM report_photos WHERE report_id = ?"
    )
    .get(reportId);
  return row ? { mimeType: row.mime_type, data: row.data } : null;
}

/** 배후 요인별 집계 (관리자 대시보드 차트용) */
export function getContributingFactorStats(): { factor: string; count: number }[] {
  // contributing_factors는 JSON 문자열이라 SQL로 직접 집계할 수 없어
  // 애플리케이션에서 펼쳐 센다. 데이터 규모상 문제되지 않는다.
  const counter = new Map<string, number>();
  for (const r of getAllReports()) {
    for (const f of r.contributingFactors) {
      counter.set(f, (counter.get(f) ?? 0) + 1);
    }
  }
  return Array.from(counter.entries())
    .map(([factor, count]) => ({ factor, count }))
    .sort((a, b) => b.count - a.count);
}
