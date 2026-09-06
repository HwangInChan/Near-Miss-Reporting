/**
 * DB 초기 시드 스크립트 (로컬 개발/수동 초기화용).
 *
 * 참고: lib/reportRepository.ts의 ensureSeeded()가 DB가 비어 있을 때 첫 조회
 * 시점에 자동으로 시드하므로, 배포 환경에서는 이 스크립트를 따로 실행하지
 * 않아도 된다. 원하는 시점에 수동으로 초기화하고 싶을 때 사용한다.
 *
 * 환경변수 TURSO_DATABASE_URL이 설정되어 있으면 원격 Turso DB를,
 * 없으면 로컬 data/near-miss.db를 대상으로 동작한다.
 *
 * 사용법:
 *   npm run db:seed         DB가 비어있을 때만 시드
 *   npm run db:seed:force   기존 데이터를 모두 지우고 새로 시드
 */
import { getDb, isRemoteDb } from "../lib/db";
import { clearAllReports, countReports, bulkInsertReports } from "../lib/reportRepository";
import { DUMMY_REPORTS, DUMMY_WORKERS } from "../lib/dummyData";

async function main() {
  const force = process.argv.includes("--force");
  console.log(`대상: ${isRemoteDb() ? "원격 Turso DB" : "로컬 data/near-miss.db"}`);

  const existing = await countReports();

  if (existing > 0 && !force) {
    console.log(
      `이미 ${existing}건의 리포트가 있어 시드를 건너뜁니다. 초기화하려면 npm run db:seed:force 를 사용하세요.`
    );
    return;
  }

  if (existing > 0 && force) {
    await clearAllReports();
    console.log(`기존 ${existing}건을 삭제했습니다.`);
  }

  // 리포트가 참조하는 작업자를 먼저 등록해야 포상 집계(JOIN)가 성립한다.
  const db = await getDb();
  await db.batch(
    DUMMY_WORKERS.map((w) => ({
      sql: "INSERT OR IGNORE INTO workers (employee_id, name, created_at) VALUES (?, ?, ?)",
      args: [w.employeeId, w.name, new Date().toISOString()],
    })),
    "write"
  );
  console.log(`${DUMMY_WORKERS.length}명의 작업자를 등록했습니다.`);

  await bulkInsertReports(DUMMY_REPORTS);
  console.log(`${DUMMY_REPORTS.length}건의 더미 리포트를 시드했습니다.`);
}

main().catch((err) => {
  console.error("시드 중 오류:", err);
  process.exit(1);
});
