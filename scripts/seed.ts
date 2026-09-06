/**
 * DB 초기 시드 스크립트 (로컬 개발/수동 초기화용).
 *
 * 참고: 이제 lib/reportRepository.ts의 ensureSeeded()가 DB가 비어있을 때
 * 첫 조회/등록 시점에 자동으로 시드하므로, 배포 환경에서는 이 스크립트를
 * 따로 실행하지 않아도 된다. 이 스크립트는 로컬에서 원하는 시점에 수동으로
 * 초기화하고 싶을 때 사용한다.
 *
 * 사용법:
 *   npm run db:seed         DB가 비어있을 때만 90건의 더미 데이터를 삽입
 *   npm run db:seed:force   기존 데이터를 모두 지우고 새로 시드
 */
import { clearAllReports, countReports, bulkInsertReports, registerWorker } from "../lib/reportRepository";
import { DUMMY_REPORTS, DUMMY_WORKERS } from "../lib/dummyData";

const force = process.argv.includes("--force");
const existing = countReports();

if (existing > 0 && !force) {
  console.log(
    `이미 ${existing}건의 리포트가 있어 시드를 건너뜁니다. 초기화하려면 npm run db:seed:force 를 사용하세요.`
  );
  process.exit(0);
}

if (existing > 0 && force) {
  clearAllReports();
  console.log(`기존 ${existing}건을 삭제했습니다.`);
}

// 리포트가 참조하는 작업자를 먼저 등록해야 포상 집계(JOIN)가 성립한다.
for (const w of DUMMY_WORKERS) {
  registerWorker(w.employeeId, w.name);
}
console.log(`${DUMMY_WORKERS.length}명의 작업자를 등록했습니다.`);

bulkInsertReports(DUMMY_REPORTS);
console.log(`${DUMMY_REPORTS.length}건의 더미 리포트를 시드했습니다. (data/near-miss.db)`);
