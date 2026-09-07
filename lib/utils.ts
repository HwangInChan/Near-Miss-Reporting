import { NearMissReport, Severity } from "./types";
import { SEVERITY_COLOR } from "./constants";

/**
 * ============================================================
 * 범용 유틸
 *
 * 특정 도메인에 묶이지 않는 작은 헬퍼만 둔다.
 * 성격이 뚜렷한 것들은 별도 파일로 분리했다.
 *   - lib/api.ts           서버 API 호출
 *   - lib/stats.ts         집계·예측 계산
 *   - lib/clientStorage.ts 브라우저 저장소·이미지 압축
 *   - lib/riskAssessment.ts 위험성평가
 * ============================================================
 */

// ---------- className 유틸 ----------
// 외부 라이브러리(clsx 등) 없이 동작하는 가벼운 자체 구현.
// 조건부 클래스: cn("base", isActive && "active", ["a", "b"])
type ClassInput = string | false | null | undefined | ClassInput[];
export function cn(...inputs: ClassInput[]): string {
  return inputs.flat(Infinity as 1).filter(Boolean).join(" ");
}

// ---------- 결정론적(seed 고정) 난수 생성기 ----------
// Math.random()은 SSR/CSR 간 하이드레이션 불일치를 유발하므로
// 더미데이터 생성에는 항상 seed 고정 PRNG를 사용한다.
export function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- 날짜/시간 포맷 ----------
export function formatRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}일 전`;
}

export function formatDateTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** 바이트를 사람이 읽기 쉬운 단위로 (예: 1.2 MB) */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// ---------- 심각도 ----------
export function severityLabel(s: Severity): string {
  return SEVERITY_COLOR[s].label;
}

/**
 * 관리자 대시보드의 "조치완료" 토글 로직.
 * 미분류/분석중 상태에서 누르면 조치완료로, 조치완료 상태에서 다시 누르면
 * 분석중으로 되돌린다 (번복).
 */
export function toggleResolvedStatus(current: NearMissReport["status"]): NearMissReport["status"] {
  return current === "조치완료" ? "분석중" : "조치완료";
}
