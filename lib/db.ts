import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { createClient, type Client } from "@libsql/client";

/**
 * DB 커넥션 (지연 초기화 싱글턴).
 *
 * libSQL 클라이언트 하나로 두 가지 모드를 모두 지원한다.
 *  - 로컬 개발: file:./data/near-miss.db  (Turso 계정 없이 그대로 동작)
 *  - 배포:      libsql://... (Turso 원격 DB)
 * 코드는 동일하고 환경변수만 바꾸면 되므로, 로컬에서 개발한 그대로 배포된다.
 *
 * 환경변수
 *  - TURSO_DATABASE_URL : 설정하면 이 주소를 사용한다. 없으면 로컬 파일.
 *  - TURSO_AUTH_TOKEN   : 원격 DB일 때 필요한 인증 토큰.
 *  - DB_FILE_PATH       : 로컬 파일 경로를 직접 지정하고 싶을 때.
 *
 * 중요: 스키마 생성/마이그레이션은 "모듈 import 시점"이 아니라 "첫 쿼리 시점"에
 * 딱 한 번 실행된다. import만으로 DB에 접속하면, Next.js가 빌드 중 여러 워커를
 * 병렬로 띄워 라우트를 로드할 때 동시 접속으로 실패한다.
 */

function resolveLocalFilePath(): string {
  if (process.env.DB_FILE_PATH) return process.env.DB_FILE_PATH;

  const preferredDir = path.join(process.cwd(), "data");
  try {
    fs.mkdirSync(preferredDir, { recursive: true });
    fs.accessSync(preferredDir, fs.constants.W_OK);
    return path.join(preferredDir, "near-miss.db");
  } catch {
    // 배포 환경에서 프로젝트 폴더가 읽기 전용이면 임시 폴더로 대체한다.
    return path.join(os.tmpdir(), "near-miss.db");
  }
}

function resolveConnection(): { url: string; authToken?: string } {
  const remote = process.env.TURSO_DATABASE_URL;
  if (remote) {
    return { url: remote, authToken: process.env.TURSO_AUTH_TOKEN };
  }
  return { url: `file:${resolveLocalFilePath()}` };
}

declare global {
  // eslint-disable-next-line no-var
  var __nearMissClient: Client | undefined;
  // eslint-disable-next-line no-var
  var __nearMissInit: Promise<Client> | undefined;
}

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS reports (
     id TEXT PRIMARY KEY,
     created_at TEXT NOT NULL,
     zone_id TEXT NOT NULL,
     reporter_alias TEXT NOT NULL,
     transcript TEXT NOT NULL,
     photo_attached INTEGER NOT NULL DEFAULT 0,
     severity TEXT NOT NULL CHECK (severity IN ('low','medium','high')),
     status TEXT NOT NULL CHECK (status IN ('미분류','분석중','조치완료')) DEFAULT '미분류',
     human_error_type TEXT,
     contributing_factors TEXT NOT NULL DEFAULT '[]'
   )`,
  `CREATE TABLE IF NOT EXISTS workers (
     employee_id TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     created_at TEXT NOT NULL
   )`,
  /*
   * 첨부 사진.
   * reports와 1:1이지만 일부러 별도 테이블로 분리했다. 같은 테이블에 두면
   * 목록 조회 때마다 수십 건의 이미지 바이트가 통째로 딸려온다.
   * 사진은 상세 화면에서 한 건씩만 필요하다.
   */
  /*
   * 사업장별 평가 기준값.
   * 위험성평가의 판정 경계(가능성 최소 건수, 임계점 등)는 표준으로 정해진 수치가
   * 아니라 사업장이 스스로 정하는 관리 기준이다. 근로자 수·운영 기간·업종 위험도에
   * 따라 달라야 하므로 코드 상수가 아니라 DB에 두고 화면에서 조정할 수 있게 한다.
   * key-value 형태로 두어 기준이 추가돼도 스키마를 바꾸지 않아도 되게 했다.
   */
  `CREATE TABLE IF NOT EXISTS settings (
     key TEXT PRIMARY KEY,
     value TEXT NOT NULL,
     updated_at TEXT NOT NULL
   )`,
  `CREATE TABLE IF NOT EXISTS report_photos (
     report_id TEXT PRIMARY KEY,
     mime_type TEXT NOT NULL,
     data BLOB NOT NULL,
     byte_size INTEGER NOT NULL,
     created_at TEXT NOT NULL
   )`,
];

/**
 * 기존 DB에도 새로 추가된 컬럼을 채워 넣는다.
 * SQLite는 컬럼 추가에 IF NOT EXISTS를 지원하지 않으므로,
 * 현재 컬럼 목록을 조회해 없는 것만 ALTER TABLE로 추가한다.
 */
const MIGRATIONS: Record<string, string> = {
  employee_id: "ALTER TABLE reports ADD COLUMN employee_id TEXT",
  is_anonymous: "ALTER TABLE reports ADD COLUMN is_anonymous INTEGER NOT NULL DEFAULT 0",
  is_exemplary: "ALTER TABLE reports ADD COLUMN is_exemplary INTEGER NOT NULL DEFAULT 0",
};

async function initialize(): Promise<Client> {
  const client = createClient(resolveConnection());

  for (const sql of SCHEMA) {
    await client.execute(sql);
  }

  const info = await client.execute("PRAGMA table_info(reports)");
  const columns = info.rows.map((r) => String(r.name));
  for (const [column, sql] of Object.entries(MIGRATIONS)) {
    if (!columns.includes(column)) {
      await client.execute(sql);
    }
  }

  return client;
}

/** DB 클라이언트를 얻는다. 스키마 준비는 최초 1회만 실행되고 이후 재사용된다. */
export function getDb(): Promise<Client> {
  if (globalThis.__nearMissClient) {
    return Promise.resolve(globalThis.__nearMissClient);
  }
  // 동시에 여러 요청이 들어와도 초기화가 한 번만 돌도록 Promise 자체를 캐싱한다.
  if (!globalThis.__nearMissInit) {
    globalThis.__nearMissInit = initialize().then((client) => {
      globalThis.__nearMissClient = client;
      return client;
    });
  }
  return globalThis.__nearMissInit;
}

/** 원격(Turso)에 연결되어 있는지 여부 - 상태 표시나 로그용 */
export function isRemoteDb(): boolean {
  return Boolean(process.env.TURSO_DATABASE_URL);
}
