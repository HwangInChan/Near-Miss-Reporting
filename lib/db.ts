import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import Database from "better-sqlite3";

/**
 * SQLite 커넥션 (지연 초기화 싱글턴).
 *
 * 중요: DB 파일은 "모듈을 import하는 시점"이 아니라 "실제로 쿼리를 실행하는 시점"에
 * 처음 열린다. 예전처럼 모듈 최상위에서 곧바로 커넥션을 만들면, Next.js가 빌드 중
 * 여러 워커 프로세스를 병렬로 띄워 각 API 라우트를 로드할 때 같은 DB 파일을 동시에
 * 열고 PRAGMA/ALTER TABLE을 실행해 SQLITE_BUSY로 빌드가 실패한다.
 * (Render 배포 중 "Failed to collect page data for /api/workers" 오류의 원인)
 *
 * - DB 파일은 기본적으로 프로젝트 루트의 data/near-miss.db 에 저장된다
 *   (환경변수 DB_FILE_PATH로 명시적으로 바꿀 수 있다).
 * - 호스팅 환경에 따라 이 경로에 쓰기 권한이 없을 수 있으므로, 쓰기가 불가능하면
 *   자동으로 OS 임시 폴더로 대체한다.
 * - 파일 하나로 동작하는 임베디드 DB이므로 별도의 DB 서버 설치/구동이 필요 없다.
 *   DB Browser for SQLite(https://sqlitebrowser.org) 같은 무료 GUI로 열어볼 수 있다.
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

declare global {
  // eslint-disable-next-line no-var
  var __nearMissDb: Database.Database | undefined;
}

function createConnection(): Database.Database {
  const db = new Database(resolveDbFilePath());

  // 다른 프로세스가 DB를 쓰고 있으면 즉시 실패하지 않고 최대 5초까지 기다린다.
  // (빌드 중 병렬 워커가 겹칠 때 SQLITE_BUSY로 죽는 것을 막는 안전장치)
  db.pragma("busy_timeout = 5000");
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
 * SQLite는 컬럼 추가에 "IF NOT EXISTS"를 지원하지 않으므로, 현재 컬럼 목록을
 * 조회해서 없는 것만 ALTER TABLE로 추가한다.
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

/**
 * DB 커넥션을 얻는다. 처음 호출될 때 한 번만 파일을 열고, 이후로는 같은 것을 재사용한다.
 * 개발 모드는 파일 변경 시 모듈을 다시 로드하므로 globalThis에 캐싱해 중복 생성을 막는다.
 */
export function getDb(): Database.Database {
  if (!globalThis.__nearMissDb) {
    globalThis.__nearMissDb = createConnection();
  }
  return globalThis.__nearMissDb;
}
