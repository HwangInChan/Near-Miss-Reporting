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
import {
  AssessmentSettings,
  DEFAULT_ASSESSMENT_SETTINGS,
} from "./assessmentSettings";

/**
 * DB 접근은 이 파일을 통해서만 이루어진다 (Repository 패턴).
 * API 라우트는 libSQL 클라이언트를 직접 다루지 않고 여기서 내보내는 함수만 사용한다.
 *
 * libSQL 클라이언트는 비동기이므로 모든 함수가 Promise를 반환한다.
 * (예전 better-sqlite3는 동기였다. 원격 DB를 쓰려면 비동기가 불가피하다.)
 */

// libSQL이 돌려주는 행은 값 타입이 느슨하므로, 여기서 도메인 타입으로 좁힌다.
type Row = Record<string, unknown>;

function toStr(v: unknown): string {
  return typeof v === "string" ? v : String(v ?? "");
}
function toNum(v: unknown): number {
  return typeof v === "number" ? v : Number(v ?? 0);
}
function toBool(v: unknown): boolean {
  return toNum(v) === 1;
}

function rowToReport(row: Row): NearMissReport {
  return {
    id: toStr(row.id),
    createdAt: toStr(row.created_at),
    zoneId: toStr(row.zone_id),
    reporterAlias: toStr(row.reporter_alias),
    transcript: toStr(row.transcript),
    photoAttached: toBool(row.photo_attached),
    severity: toStr(row.severity) as Severity,
    status: toStr(row.status) as ReportStatus,
    humanErrorType: row.human_error_type
      ? (toStr(row.human_error_type) as HumanErrorType)
      : undefined,
    contributingFactors: JSON.parse(
      toStr(row.contributing_factors) || "[]"
    ) as ContributingFactor[],
    employeeId: row.employee_id ? toStr(row.employee_id) : undefined,
    isAnonymous: toBool(row.is_anonymous),
    isExemplary: toBool(row.is_exemplary),
  };
}

const INSERT_REPORT_SQL = `
  INSERT INTO reports
    (id, created_at, zone_id, reporter_alias, transcript, photo_attached, severity, status,
     human_error_type, contributing_factors, employee_id, is_anonymous, is_exemplary)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

function reportInsertArgs(r: NearMissReport) {
  return [
    r.id,
    r.createdAt,
    r.zoneId,
    r.reporterAlias,
    r.transcript,
    r.photoAttached ? 1 : 0,
    r.severity,
    r.status,
    r.humanErrorType ?? null,
    JSON.stringify(r.contributingFactors),
    r.employeeId ?? null,
    r.isAnonymous ? 1 : 0,
    r.isExemplary ? 1 : 0,
  ];
}

/** 시드 스크립트 및 자동 시드에서 재사용하는 대량 삽입 */
export async function bulkInsertReports(reports: NearMissReport[]): Promise<void> {
  const db = await getDb();
  // 여러 문장을 한 번에 보내 왕복 횟수를 줄인다 (원격 DB에서 특히 중요).
  await db.batch(
    reports.map((r) => ({ sql: INSERT_REPORT_SQL, args: reportInsertArgs(r) })),
    "write"
  );
}

/**
 * 배포 환경에서는 DB가 비어 있는 상태로 시작할 수 있다. 그럴 때 대시보드가
 * 완전히 빈 화면이 되지 않도록, 테이블이 비어 있으면 첫 조회 시점에 자동으로
 * 더미 데이터를 채워 넣는다. 이미 데이터가 있으면 아무것도 하지 않는다.
 */
async function ensureSeeded(): Promise<void> {
  if ((await countReports()) > 0) return;

  const db = await getDb();
  // 리포트가 참조하는 작업자를 먼저 등록해야 포상 집계(JOIN)가 성립한다.
  await db.batch(
    DUMMY_WORKERS.map((w) => ({
      sql: "INSERT OR IGNORE INTO workers (employee_id, name, created_at) VALUES (?, ?, ?)",
      args: [w.employeeId, w.name, new Date().toISOString()],
    })),
    "write"
  );
  await bulkInsertReports(DUMMY_REPORTS);
}

/** 전체 리포트를 최신순으로 조회 */
export async function getAllReports(): Promise<NearMissReport[]> {
  await ensureSeeded();
  const db = await getDb();
  const res = await db.execute("SELECT * FROM reports ORDER BY created_at DESC");
  return res.rows.map((r) => rowToReport(r as Row));
}

/** 특정 작업자가 낸 기명 신고만 최신순으로 조회 (내 신고 이력용) */
export async function getReportsByEmployee(employeeId: string): Promise<NearMissReport[]> {
  await ensureSeeded();
  const db = await getDb();
  const res = await db.execute({
    sql: "SELECT * FROM reports WHERE employee_id = ? ORDER BY created_at DESC",
    args: [employeeId],
  });
  return res.rows.map((r) => rowToReport(r as Row));
}

export async function getReportById(id: string): Promise<NearMissReport | null> {
  const db = await getDb();
  const res = await db.execute({ sql: "SELECT * FROM reports WHERE id = ?", args: [id] });
  return res.rows.length ? rowToReport(res.rows[0] as Row) : null;
}

export interface NewReportInput {
  zoneId: string;
  transcript: string;
  reporterAlias?: string;
  photoAttached?: boolean;
  severity?: Severity;
  employeeId?: string;
  /** 신고자 이름. 서버에 해당 사번이 없으면 이 이름으로 자동 등록한다. */
  employeeName?: string;
  isAnonymous?: boolean;
}

/** 작업자 리포팅 화면에서 접수된 새 아차사고를 저장한다 */
export async function createReport(input: NewReportInput): Promise<NearMissReport> {
  await ensureSeeded();

  const isAnonymous = input.isAnonymous ?? false;
  // 익명 신고는 사번을 아예 저장하지 않는다. 나중에 실수로라도 역추적되지 않고,
  // 포상 집계(employee_id 기준)에서도 자연히 빠진다.
  const employeeId = isAnonymous ? undefined : input.employeeId;

  /*
   * 작업자 신원은 브라우저(localStorage)에도 저장되므로, DB를 새로 만들거나
   * 옮기면 "브라우저에는 사번이 있는데 서버 workers 테이블에는 없는" 상태가
   * 생긴다. 그러면 신고에 사번은 붙지만 포상 집계 JOIN에서 누락된다.
   * 그래서 신고 시점에 사번+이름을 함께 받아 없으면 자동 등록해 스스로 복구한다.
   */
  let worker: Worker | null = null;
  if (employeeId) {
    worker = await getWorker(employeeId);
    if (!worker && input.employeeName) {
      worker = await registerWorker(employeeId, input.employeeName);
    }
  }

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

  const db = await getDb();
  await db.execute({ sql: INSERT_REPORT_SQL, args: reportInsertArgs(report) });

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
export async function updateReport(
  id: string,
  patch: ReportPatch
): Promise<NearMissReport | null> {
  const existing = await getReportById(id);
  if (!existing) return null;

  const merged: NearMissReport = {
    ...existing,
    status: patch.status ?? existing.status,
    humanErrorType: patch.humanErrorType ?? existing.humanErrorType,
    contributingFactors: patch.contributingFactors ?? existing.contributingFactors,
    isExemplary: patch.isExemplary ?? existing.isExemplary,
    severity: patch.severity ?? existing.severity,
  };

  const db = await getDb();
  await db.execute({
    sql: `UPDATE reports
          SET status = ?, human_error_type = ?, contributing_factors = ?,
              is_exemplary = ?, severity = ?
          WHERE id = ?`,
    args: [
      merged.status,
      merged.humanErrorType ?? null,
      JSON.stringify(merged.contributingFactors),
      merged.isExemplary ? 1 : 0,
      merged.severity,
      id,
    ],
  });

  return merged;
}

export async function countReports(): Promise<number> {
  const db = await getDb();
  const res = await db.execute("SELECT COUNT(*) as count FROM reports");
  return toNum((res.rows[0] as Row)?.count);
}

/** 시드 스크립트 전용: 전체 삭제 후 초기화 */
export async function clearAllReports(): Promise<void> {
  const db = await getDb();
  await db.batch(["DELETE FROM report_photos", "DELETE FROM reports"], "write");
}

/* ============================================================
 * 작업자(사번)
 * ============================================================ */

function rowToWorker(row: Row): Worker {
  return {
    employeeId: toStr(row.employee_id),
    name: toStr(row.name),
    createdAt: toStr(row.created_at),
  };
}

export async function getWorker(employeeId: string): Promise<Worker | null> {
  const db = await getDb();
  const res = await db.execute({
    sql: "SELECT * FROM workers WHERE employee_id = ?",
    args: [employeeId],
  });
  return res.rows.length ? rowToWorker(res.rows[0] as Row) : null;
}

/**
 * 작업자를 등록하거나, 이미 등록된 사번이면 기존 정보를 돌려준다.
 * 같은 사번으로 다른 이름을 보내면 이름을 갱신한다 (오타 수정 등).
 */
export async function registerWorker(employeeId: string, name: string): Promise<Worker> {
  const db = await getDb();
  const existing = await getWorker(employeeId);

  if (existing) {
    if (existing.name !== name) {
      await db.execute({
        sql: "UPDATE workers SET name = ? WHERE employee_id = ?",
        args: [name, employeeId],
      });
      return { ...existing, name };
    }
    return existing;
  }

  const worker: Worker = { employeeId, name, createdAt: new Date().toISOString() };
  await db.execute({
    sql: "INSERT INTO workers (employee_id, name, created_at) VALUES (?, ?, ?)",
    args: [worker.employeeId, worker.name, worker.createdAt],
  });
  return worker;
}

/**
 * 포상 집계 순위.
 * employee_id가 NULL인 행(익명 신고 및 사번 도입 이전 데이터)은 JOIN 조건에서
 * 자연스럽게 제외되므로, "익명 신고는 포상 대상에서 제외"가 별도 처리 없이
 * 구조적으로 보장된다.
 */
export async function getRewardRankings(): Promise<RewardRanking[]> {
  await ensureSeeded();
  const db = await getDb();
  /*
   * reports를 기준으로 workers를 LEFT JOIN한다 (반대가 아님).
   * workers 기준으로 JOIN하면, 작업자 등록이 어긋난 신고가 집계에서 통째로
   * 사라진다. 리포트 기준으로 세면 등록이 없어도 사번으로는 집계되고
   * 이름만 비어 있게 되므로, 데이터가 조용히 누락되지 않는다.
   * 익명 신고는 employee_id가 NULL이라 WHERE 절에서 자연히 제외된다.
   */
  const res = await db.execute(`
    SELECT
      r.employee_id,
      COALESCE(w.name, '(미등록 사번)') AS name,
      COUNT(r.id) AS total_count,
      SUM(CASE WHEN r.is_exemplary = 1 THEN 1 ELSE 0 END) AS exemplary_count,
      SUM(CASE WHEN r.status = '조치완료' THEN 1 ELSE 0 END) AS resolved_count
    FROM reports r
    LEFT JOIN workers w ON w.employee_id = r.employee_id
    WHERE r.employee_id IS NOT NULL
    GROUP BY r.employee_id, w.name
    ORDER BY exemplary_count DESC, total_count DESC, name ASC
  `);

  return res.rows.map((row) => {
    const r = row as Row;
    return {
      employeeId: toStr(r.employee_id),
      name: toStr(r.name),
      totalCount: toNum(r.total_count),
      exemplaryCount: toNum(r.exemplary_count),
      resolvedCount: toNum(r.resolved_count),
    };
  });
}

/* ============================================================
 * 첨부 사진
 *
 * 이미지는 BLOB으로 DB 안에 함께 저장한다. 파일시스템에 따로 두면 컨테이너가
 * 재시작되는 환경에서 "DB 기록은 남았는데 이미지만 사라지는" 불일치가 생긴다.
 * 둘의 수명을 일치시키면 백업도 DB 하나만 챙기면 된다.
 *
 * 원본을 그대로 넣으면 용량이 급격히 커지므로 업로드 전 클라이언트에서
 * 리사이즈·압축하고(lib/utils.ts의 compressImage), 서버에서도 상한을 강제한다.
 * ============================================================ */

/** 서버가 받아들이는 사진 1장의 최대 크기 (압축 후 기준) */
export const MAX_PHOTO_BYTES = 1_500_000; // 1.5MB

export async function savePhoto(
  reportId: string,
  mimeType: string,
  data: Buffer
): Promise<void> {
  const db = await getDb();
  await db.execute({
    sql: `INSERT INTO report_photos (report_id, mime_type, data, byte_size, created_at)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(report_id) DO UPDATE SET
            mime_type = excluded.mime_type,
            data = excluded.data,
            byte_size = excluded.byte_size,
            created_at = excluded.created_at`,
    args: [reportId, mimeType, data, data.byteLength, new Date().toISOString()],
  });
}

export async function getPhoto(
  reportId: string
): Promise<{ mimeType: string; data: Buffer } | null> {
  const db = await getDb();
  const res = await db.execute({
    sql: "SELECT mime_type, data FROM report_photos WHERE report_id = ?",
    args: [reportId],
  });
  if (!res.rows.length) return null;

  const row = res.rows[0] as Row;
  // libSQL은 BLOB을 ArrayBuffer로 돌려준다.
  return { mimeType: toStr(row.mime_type), data: Buffer.from(row.data as ArrayBuffer) };
}

/** 저장된 사진의 총 용량 (관리자에게 DB 사용량을 알려주기 위함) */
export async function getPhotoStorageUsage(): Promise<{ count: number; totalBytes: number }> {
  const db = await getDb();
  const res = await db.execute(
    "SELECT COUNT(*) as count, COALESCE(SUM(byte_size), 0) as total FROM report_photos"
  );
  const row = res.rows[0] as Row;
  return { count: toNum(row.count), totalBytes: toNum(row.total) };
}

/** 배후 요인별 집계 (관리자 대시보드 차트용) */
export async function getContributingFactorStats(): Promise<
  { factor: string; count: number }[]
> {
  // contributing_factors는 JSON 문자열이라 SQL로 직접 집계할 수 없어
  // 애플리케이션에서 펼쳐 센다. 이 앱의 데이터 규모에서는 문제되지 않는다.
  const counter = new Map<string, number>();
  for (const r of await getAllReports()) {
    for (const f of r.contributingFactors) {
      counter.set(f, (counter.get(f) ?? 0) + 1);
    }
  }
  return Array.from(counter.entries())
    .map(([factor, count]) => ({ factor, count }))
    .sort((a, b) => b.count - a.count);
}

/* ============================================================
 * 사업장별 평가 기준값 (settings 테이블)
 * ============================================================ */

const SETTINGS_KEY = "assessment";

/** 저장된 기준값을 읽는다. 없거나 손상됐으면 기본값을 돌려준다. */
export async function getAssessmentSettings(): Promise<AssessmentSettings> {
  const db = await getDb();
  const res = await db.execute({
    sql: "SELECT value FROM settings WHERE key = ?",
    args: [SETTINGS_KEY],
  });
  if (!res.rows.length) return DEFAULT_ASSESSMENT_SETTINGS;

  try {
    const parsed = JSON.parse(toStr((res.rows[0] as Row).value)) as Partial<AssessmentSettings>;
    // 일부 항목만 저장되어 있어도 나머지는 기본값으로 채운다.
    return { ...DEFAULT_ASSESSMENT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_ASSESSMENT_SETTINGS;
  }
}

export async function saveAssessmentSettings(
  settings: AssessmentSettings
): Promise<AssessmentSettings> {
  const db = await getDb();
  await db.execute({
    sql: `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    args: [SETTINGS_KEY, JSON.stringify(settings), new Date().toISOString()],
  });
  return settings;
}
