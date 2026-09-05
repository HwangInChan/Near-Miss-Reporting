# 아차사고(Near-miss) & 인적 오류 리포팅 웹앱 — 프로토타입

현장 작업자가 아차사고를 3초 만에 보고하고, 안전 관리자가 인적 오류를 태깅해
하인리히 1:29:300 법칙 기반으로 중대재해를 예측/예방하는 프로토타입입니다.

## 버전 히스토리 (요약)

- **v0.1**: 정적 더미데이터 기반 프로토타입 (작업자 화면 / 관리자 대시보드 뼈대)
- **v0.2**: SQLite DB 연동 — 작업자 화면 제출이 실제로 대시보드에 반영됨, 조치완료 번복 기능
- **v0.3**:
  - 마이크 버튼이 **실제 브라우저 음성 인식**(Web Speech API)으로 동작 (더 이상 정해진 문장을
    무작위로 보여주는 모사 기능이 아님)
  - 인적 오류 분류값을 영어(Slip/Lapse/Mistake/Violation)에서 **한글(실수/망각/착오/위반)로 통일**
    — 화면 표시용 라벨이 아니라 DB에 실제로 저장되는 값 자체를 한글로 바꿈
  - 관리자 대시보드 진입 시 리포트가 자동으로 선택되어 상세 패널이 열리던 것을 제거 (사용자가
    직접 클릭하기 전까지는 빈 상태 유지)
  - 대시보드 분석 위젯 4종(임계점 경보·하인리히 피라미드·인적오류 도넛·구역별 히트맵)을
    한 줄에 배치하고, 창 너비에 따라 자동으로 2열/1열로 줄바꿈되는 반응형 레이아웃으로 개편
  - 하인리히 피라미드를 사다리꼴 3단이 아닌, 꼭짓점이 있는 진짜 삼각형 하나로 재작성
- **v0.4** (현재):
  - 음성 인식 관련 이슈 원인 확정: 개발 중 한때 특정 PC에서 음성 인식이 계속 실패했는데,
    여러 차례 코드를 점검/재설계(중복 세션 방지, 매번 새 인스턴스 생성 등)한 끝에도 재현되어
    네트워크 차단을 의심했으나, 다른 기기(모바일)로 배포본에 접속해 테스트한 결과 정상
    동작을 확인했다. 최종적으로 **문제가 있던 특정 노트북의 마이크 하드웨어 자체의 문제**로
    결론지었다 — 코드/네트워크 문제가 아니었다. 참고로 이 과정에서 발견해 고친 진짜 코드
    버그(React Strict Mode로 인한 중복 세션 생성, `stop()` 호출 시 상태를 실제보다 먼저
    갱신하던 문제 등)는 그대로 반영되어 있으며, 이후로도 유효한 개선 사항이다.
  - 모바일 화면에서 대시보드 헤더의 "새로고침" 버튼 글자가 좁은 화면 폭 때문에 단어 중간에서
    줄바꿈되던 문제 수정 (헤더를 모바일에서는 세로로, 데스크탑에서는 가로로 배치하는 반응형
    구조로 변경하고, 버튼/카운트 텍스트에 줄바꿈 방지 처리 추가)

## 빠른 시작

```bash
npm install       # better-sqlite3 등 의존성 설치 (네이티브 모듈 포함)
npm run db:seed   # DB가 비어있으면 90건의 더미 데이터로 초기화
npm run dev
```

- `http://localhost:3000` — 랜딩(역할 선택)
- `http://localhost:3000/report` — 작업자 모바일 리포팅 화면 (제출 시 실제 DB에 저장)
- `http://localhost:3000/dashboard` — 안전 관리자 대시보드 (DB에서 실시간으로 조회)

## DB는 어떻게 되어 있나요?

- **엔진**: SQLite (better-sqlite3). 별도 DB 서버 설치·구동이 필요 없는 파일 기반 DB입니다.
- **파일 위치**: `data/near-miss.db` (첫 실행 시 자동 생성, `.gitignore`에 포함되어 저장소에는 올라가지 않습니다)
- **직접 관리하는 방법**: 무료 GUI 툴인 [DB Browser for SQLite](https://sqlitebrowser.org)로
  `data/near-miss.db` 파일을 열면, 엑셀처럼 테이블을 보고 행을 직접 추가/수정/삭제할 수 있습니다.
  서버를 끄고 켜도 데이터는 그대로 유지됩니다.
- **DB 파일 경로를 바꾸고 싶다면**: 환경변수 `DB_FILE_PATH`를 지정하세요.
  (`DB_FILE_PATH=/some/path/near-miss.db npm run dev`)

### 데이터 초기화하기

```bash
npm run db:seed         # DB가 비어있을 때만 90건 시드 (이미 데이터가 있으면 건너뜀)
npm run db:seed:force   # 기존 데이터를 모두 지우고 90건으로 새로 시드
```

## 인적 오류 분류값은 한글입니다

`lib/types.ts`의 `HumanErrorType`은 `"실수" | "망각" | "착오" | "위반"` 네 가지 값입니다.
이건 화면에만 보이는 라벨이 아니라 **DB `reports.human_error_type` 컬럼에 실제로 저장되는 값**이고,
`lib/constants.ts`의 `HUMAN_ERROR_COLORS`(도넛 차트·태깅 버튼 색상 매핑)도 이 값을 그대로 키로
씁니다. 나중에 이 분류 체계를 바꾸고 싶다면 `lib/types.ts` → `lib/constants.ts` →
`lib/dummyData.ts`(시드용 로컬 배열) → `lib/utils.ts`(`countByHumanError`) 순서로 확인하면
빠짐없이 찾을 수 있습니다.

## API 엔드포인트

| Method | 경로 | 설명 |
| --- | --- | --- |
| GET | `/api/reports` | 전체 리포트 조회 (최신순) |
| POST | `/api/reports` | 새 아차사고 등록 (작업자 화면에서 호출) — `{ zoneId, transcript, photoAttached }` |
| PATCH | `/api/reports/:id` | 상태/인적오류/배후요인 수정 — `{ status?, humanErrorType?, contributingFactors? }` |

## 주요 기능

1. **조치완료 번복**: 관리자 대시보드 상세 패널의 버튼이 토글 방식입니다.
   "조치완료 처리"를 누르면 완료 처리되고, 완료된 상태에서 같은 버튼("조치완료 번복하기")을
   다시 누르면 "분석중" 상태로 되돌아갑니다. 이때 이미 태깅해둔 인적오류/배후요인은 유지됩니다.
   (`lib/utils.ts`의 `toggleResolvedStatus()`)
2. **작업자 → 관리자 실시간 반영**: 작업자 화면에서 제출하면 `POST /api/reports`로 DB에 즉시
   저장되고, 관리자 대시보드는 8초마다 자동으로 목록을 다시 불러옵니다(폴링). 화면 우측 상단의
   "새로고침" 버튼으로 즉시 갱신할 수도 있습니다.
   실제 운영 환경에서는 폴링 대신 웹소켓/Server-Sent Events로 바꾸는 것을 권장합니다.
3. **실제 음성 인식**: 아래 "음성 인식" 섹션 참고.

## 폴더 구조

```
app/
  page.tsx                랜딩 페이지
  report/page.tsx          작업자 리포팅 페이지
  dashboard/page.tsx       관리자 대시보드 페이지
  api/reports/route.ts     GET(목록) · POST(신규 등록)
  api/reports/[id]/route.ts PATCH(상태/태깅 수정, 조치완료 토글 포함)
  layout.tsx / globals.css

components/
  report/                 작업자 화면 컴포넌트 (ReportForm이 /api/reports로 제출)
  dashboard/              관리자 대시보드 컴포넌트 (DashboardClient가 DB를 폴링)
  analytics/              하인리히 피라미드 · 임계점 위젯 · 히트맵 · 도넛 차트
  common/                 Badge, PanelCard

lib/
  types.ts                도메인 타입 (단일 진실 공급원, 인적오류 분류 등)
  constants.ts             컬러 토큰 · 구역 · 임계치 상수
  utils.ts                 공통 유틸 — className, 집계 함수, 하인리히 계산,
                            그리고 fetchReports/submitReport/patchReport 등
                            프런트엔드용 API 클라이언트 함수까지 전부 여기 하나로 통합
  db.ts                    SQLite 커넥션 싱글턴 + 스키마 생성 (서버 전용)
  reportRepository.ts      DB CRUD 함수 (Repository 패턴, 서버 전용)
  dummyData.ts             시드용 더미 데이터 생성기 (seed 고정 PRNG)
  useSpeechRecognition.ts  브라우저 Web Speech API를 감싼 커스텀 훅

scripts/
  seed.ts                  DB 초기 데이터 삽입 스크립트

data/
  near-miss.db             SQLite DB 파일 (자동 생성, git에는 포함 안 됨)
```

## 음성 인식

작업자 화면의 마이크 버튼은 브라우저 내장 **Web Speech API**를 사용합니다
(`lib/useSpeechRecognition.ts`). 별도 API 키나 서버 비용 없이, 실제로 말한 내용이
한국어로 인식되어 텍스트 칸에 채워집니다.

- **한 문장 단위로 동작**(`continuous: false`): 마이크를 누르면 듣기 시작하고, 한 문장을
  말하면(또는 침묵이 감지되면) 자동으로 종료됩니다. "3초 보고"라는 용도에 맞춘 설정입니다.
- **마이크를 누를 때마다 완전히 새 인식 세션을 만듭니다**: 이전 세션 상태를 재사용/추적하지
  않고, 매번 기존 것을 폐기(`abort`)하고 새로 생성합니다. 이렇게 한 이유는 브라우저의
  `InvalidStateError`("recognition has already started")가 상태 추적 방식으로는 계속
  재현되어, 아예 추적할 상태 자체를 없애는 방향으로 설계를 바꿨기 때문입니다.
- **지원 브라우저**: Chrome, Edge (Chromium 계열). Firefox·Safari는 지원하지 않으며,
  이 경우 자동으로 "이 브라우저는 음성 인식을 지원하지 않아요" 안내가 뜨고 직접 입력
  칸으로 전환됩니다.
- **HTTPS 필요**: 브라우저 보안 정책상 `localhost` 또는 HTTPS 환경에서만 동작합니다.
  Render에 배포하면 자동으로 HTTPS가 적용되므로 문제없습니다.
- **마이크 권한**: 처음 사용할 때 브라우저가 마이크 권한을 물어봅니다. 거부하면
  화면에 안내 메시지가 뜹니다.

### ⚠️ 음성 인식이 안 될 때 확인해야 할 것들

Chrome의 음성 인식은 마이크 입력을 **구글 서버로 전송해서 처리한 뒤 결과를 돌려받는**
방식으로 동작합니다. 개발 중 특정 PC에서 "듣고 있어요" 상태까지는 되는데 인식 결과가
끝내 오지 않는 문제를 겪었고, 처음에는 학교 네트워크가 구글 음성 인식 서버 접근을 막고
있는 것으로 의심했습니다. 하지만 같은 배포본에 다른 기기(모바일)로 접속해 테스트해보니
정상 동작했고, 최종적으로는 **그 PC의 마이크 하드웨어 자체의 문제**로 확인됐습니다 —
코드나 네트워크 문제가 아니었습니다.

그래도 아래 두 가지는 여전히 이 기능이 안 될 수 있는 일반적인 원인이니 순서대로 확인하세요.

1. **마이크 하드웨어/OS 설정 확인**: OS의 소리 설정에서 마이크가 실제로 소리를 인식하는지
   확인하거나(다른 앱에서 마이크 테스트), 다른 기기(휴대폰 등)로 같은 페이지에 접속해
   같은 증상이 재현되는지 봅니다. 다른 기기에서는 되는데 특정 PC에서만 안 된다면 그 PC의
   마이크/드라이버 문제일 가능성이 큽니다.
2. **네트워크 차단 확인**: 마이크는 정상인데도 안 된다면, 개발자 도구 콘솔에
   `[useSpeechRecognition] onerror: network`가 찍히는지 확인하세요. 이게 찍히면 학교·회사
   네트워크의 방화벽/프록시가 구글 음성 인식 서버 접근을 막고 있다는 뜻이며, 코드로 해결할
   수 있는 부분이 아닙니다. 휴대폰 모바일 데이터로 전환해 같은 테스트를 해보면 확인됩니다.

**확인 방법**: 마이크를 누르고 몇 초 기다렸을 때 뜨는 안내 메시지를 확인하세요.
"네트워크 문제로 음성 인식 서버에 연결하지 못했습니다"가 뜨거나, 개발자 도구 콘솔에
`[useSpeechRecognition] onerror: network`가 찍히면 네트워크 차단이 원인입니다.
휴대폰 핫스팟 등 다른 네트워크로 바꿔서 같은 테스트를 해보면 확실히 확인할 수 있습니다.

### 이미지 인식(사진 속 내용 자동 분석)은 왜 지금 안 넣었나

사진을 실제로 "이해"하려면 Google Cloud Vision, 네이버 Clova OCR, OpenAI Vision API
같은 유료 클라우드 서비스가 필요하고, 이는 **본인 명의로 가입 후 API 키를 발급받아야만**
사용할 수 있습니다. 코드만으로 해결할 수 있는 부분이 아니라 이번에는 넣지 않았습니다.
나중에 API 키를 발급받으시면, `components/report/PhotoUploader.tsx`에서 사진을
업로드하는 지점에 해당 API 호출을 추가하는 방식으로 붙일 수 있습니다.

## 배포하기 (Git + Render.com, 무료)

이 프로젝트는 Render.com의 무료 Web Service로 바로 배포할 수 있습니다.
Render는 (Vercel 같은 서버리스와 달리) 앱을 항상 켜져 있는 일반 서버 컨테이너로 실행하기
때문에, 지금 쓰고 있는 SQLite(`better-sqlite3`)가 로컬과 똑같이 그대로 동작합니다.

**참고**: 무료 Web Service는 15분 동안 요청이 없으면 잠들고, 다음 요청에서 다시 깨어나며
이때 컨테이너가 새로 시작되어 DB 파일도 초기화됩니다. `lib/reportRepository.ts`의
`ensureSeeded()`가 있어 매번 깨끗한 90건으로 자동 채워지므로 데모용으로는 문제없습니다.
데이터를 계속 보존하고 싶다면 Render의 유료 Persistent Disk를 web service에 붙이거나,
DB를 Postgres 같은 외부 관리형 DB로 옮기는 것을 다음 단계로 고려하세요.

1. GitHub에 저장소 만들고 이 코드를 푸시합니다.
2. https://render.com 에서 GitHub로 로그인 → New + → Web Service → 방금 만든 저장소 선택.
3. 아래처럼 설정합니다.
   - Runtime: Node
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start`
   - Instance Type: Free
4. Create Web Service를 누르면 빌드/배포가 시작되고, 끝나면 `https://<서비스이름>.onrender.com` 주소가 발급됩니다.
5. `https://.../report`에서 제출 → `https://.../dashboard`에서 새로고침(또는 8초 후 자동)하면 반영되는 걸 확인할 수 있습니다.

## 트러블슈팅

- **`npm install` 중 better-sqlite3에서 node-gyp 관련 오류가 난다면**: better-sqlite3는
  주요 플랫폼(Windows/macOS/Linux, x64/arm64)용 사전 컴파일 바이너리를 패키지 안에 이미
  포함하고 있습니다. 그런데도 설치 스크립트가 굳이 다시 빌드를 시도하다가, 네트워크가
  제한된 환경(사내망, 샌드박스 등)에서 Node 헤더 다운로드가 막혀 실패하는 경우가 있습니다.
  이럴 때는 `npm install --ignore-scripts`로 설치하세요 — 빌드 단계를 건너뛰고 이미
  패키지에 포함된 바이너리를 그대로 사용하기 때문에 정상 동작합니다.
- **마이크를 눌러도 아무 반응이 없거나 브라우저 탭 제목이 이상하게 보인다면**: `node_modules`와
  `.next` 폴더를 지우고 `npm install`부터 다시 실행해보세요. `app/layout.tsx`는 빌드 시
  Google Fonts(Barlow Condensed, Inter)를 인터넷에서 내려받으므로, 빌드 시점에 네트워크가
  불안정했다면 낡은 빌드 캐시가 남아있을 수 있습니다.
- **음성 인식이 계속 안 된다면**: 위 "음성 인식이 안 될 때 확인해야 할 것들" 섹션을 참고하세요
  (마이크 하드웨어 문제일 수도, 네트워크 차단 문제일 수도 있습니다).

## 알아두면 좋은 것들

- **왜 Prisma 같은 ORM 대신 better-sqlite3를 직접 썼나요?**: 프로토타입 단계에서는 별도 엔진
  다운로드나 마이그레이션 도구 없이 `npm install`만으로 바로 돌아가는 게 더 중요하다고 판단했습니다.
  DB 로직은 전부 `lib/reportRepository.ts` 한 파일에 모아뒀기 때문에, 나중에 Prisma나 Postgres로
  옮기고 싶다면 이 파일의 함수 시그니처(`getAllReports`, `createReport`, `updateReport`)만
  유지한 채 내부 구현만 교체하면 됩니다.
- **알려진 보안 이슈**: 현재 Next.js 14.2.x 라인에는 npm audit에서 보고되는 취약점이 일부
  남아있습니다(대부분 Next 16으로 메이저 업그레이드해야 완전히 해소됨). 로컬 프로토타입
  용도로는 문제없지만, 실제 서비스에 배포하기 전에는 `npm audit`을 확인하고 최신 안정 버전으로
  업그레이드하는 것을 권장합니다.

## 다음 단계로 이어가면 좋은 것들

1. 학교/회사 네트워크처럼 구글 음성 인식 서버 접근이 막힌 환경을 위한 대안 — 서버에서
   오디오를 받아 처리하는 유료 STT API(OpenAI Whisper, 네이버 Clova Speech 등)로 폴백
2. 이미지 인식 API 연동 (위 "이미지 인식" 섹션 참고)
3. 폴링 대신 웹소켓/SSE로 실시간 반영 전환
4. 로그인/권한 분리 (작업자는 제출만, 관리자만 태깅/조치완료 가능하도록)
5. 히트맵을 실제 공장 도면 이미지 위에 오버레이하는 버전
6. 조치완료 이력(누가, 언제 상태를 바꿨는지) 로그 테이블 추가
