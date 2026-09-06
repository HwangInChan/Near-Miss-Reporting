import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import Database from "better-sqlite3";

/**
 * SQLite 커넥션 싱글턴.
 *
 * - DB 파일은 기본적으로 프로젝트 루트의 data/near-miss.db 에 저장된다
 *   (환경변수 DB_FILE_PATH로 명시적으로 바꿀 수 있다).
 * - 호스팅 환경에 따라 이 경로에 쓰기 권한이 없을 수 있으므로(읽기 전용 배포본 등),
 *   쓰기가 불가능하면 자동으로 OS 임시 폴더(os.tmpdir())로 대체한다. 이 경우 서버가
 *   재시작되면 데이터가 초기화되는데, 데모 목적에서는 오히려 매번 깨끗한 상태로
 *   시작되는 것이므로 문제가 되지 않는다.
 * - Next.js 개발 모드는 파일 변경 시 모듈을 다시 로드하므로, globalThis에 인스턴스를
 *   캐싱해 커넥션이 중복 생성되는 것을 막는다.
 * - 파일 하나로 동작하는 임베디드 DB이므로 별도의 DB 서버 설치/구동이 필요 없다.
 *   DB Browser for SQLite(https://sqlitebrowser.org) 같은 무료 GUI로 data/near-miss.db를
 *   직접 열어 데이터를 조회/수정할 수 있다.
 */

function resolveDbFilePath(): string {
  if (process.env.DB_FILE_PATH) {
    // 명시적으로 지정된 경로는 그대로 신뢰한다.
    return process.env.DB_FILE_PATH;
  }

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

const DB_FILE_PATH = resolveDbFilePath();

declare global {
  // eslint-disable-next-line no-var
  var __nearMissDb: Database.Database | undefined;
}

function createConnection(): Database.Database {
  const db = new Database(DB_FILE_PATH);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS reports (
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
    );

    CREATE TABLE IF NOT EXISTS workers (
      employee_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  migrate(db);

  return db;
}

/**
 * 기존에 만들어진 DB 파일에도 새로 추가된 컬럼을 자동으로 채워 넣는다.
 * (이미 데이터가 쌓인 data/near-miss.db를 지우지 않고 그대로 쓸 수 있게 하기 위함)
 * SQLite는 "IF NOT EXISTS"를 지원하지 않으므로, 현재 컬럼 목록을 조회해서
 * 없는 것만 ALTER TABLE로 추가한다.
 */
function migrate(db: Database.Database): void {
  const columns = db
    .prepare<[], { name: string }>("PRAGMA table_info(reports)")
    .all()
    .map((c) => c.name);

  const additions: Record<string, string> = {
    // 신고자 사번. 익명 신고이거나 사번 도입 이전의 과거 데이터면 NULL.
    employee_id: "ALTER TABLE reports ADD COLUMN employee_id TEXT",
    // 익명 신고 여부. 익명이면 포상 집계에서 제외된다.
    is_anonymous: "ALTER TABLE reports ADD COLUMN is_anonymous INTEGER NOT NULL DEFAULT 0",
    // 관리자가 "중대재해를 예방한 우수 신고"로 표시했는지 여부 (질적 포상용).
    is_exemplary: "ALTER TABLE reports ADD COLUMN is_exemplary INTEGER NOT NULL DEFAULT 0",
  };

  for (const [column, sql] of Object.entries(additions)) {
    if (!columns.includes(column)) {
      db.exec(sql);
    }
  }
}

export const db: Database.Database = globalThis.__nearMissDb ?? createConnection();

if (process.env.NODE_ENV !== "production") {
  globalThis.__nearMissDb = db;
}
