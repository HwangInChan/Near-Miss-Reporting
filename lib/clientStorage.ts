"use client";

import { Worker } from "./types";

/**
 * ============================================================
 * 브라우저 전용 유틸 (localStorage, Canvas)
 *
 * 서버에서는 동작하지 않으므로 클라이언트 컴포넌트에서만 사용한다.
 * ============================================================
 */

/* ---------- 작업자 신원의 기기 저장 ---------- */
// 사번을 매번 입력하지 않도록 브라우저에 기억해둔다.
// (서버 세션/로그인이 아니라 "이 기기에서 쓰는 사람" 정도의 가벼운 식별)

const WORKER_STORAGE_KEY = "nearmiss.worker";

export function loadStoredWorker(): Worker | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(WORKER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Worker) : null;
  } catch {
    return null;
  }
}

export function saveStoredWorker(worker: Worker): void {
  try {
    window.localStorage.setItem(WORKER_STORAGE_KEY, JSON.stringify(worker));
  } catch {
    // 사생활 보호 모드 등으로 저장이 막혀도 앱 동작 자체는 계속되어야 한다.
  }
}

export function clearStoredWorker(): void {
  try {
    window.localStorage.removeItem(WORKER_STORAGE_KEY);
  } catch {
    // 무시
  }
}

/* ---------- 이미지 압축 ---------- */

/**
 * 촬영한 사진을 업로드 전에 리사이즈·압축해 data URL로 만든다.
 *
 * 요즘 스마트폰 사진은 한 장에 3~8MB라 원본을 그대로 DB에 넣으면 금세 비대해지고
 * 느린 현장 네트워크에서 업로드도 오래 걸린다. 아차사고 기록용으로는 "무엇이
 * 문제인지 알아볼 수 있는" 수준이면 충분하므로 긴 변 1280px, JPEG 품질 0.7로
 * 줄인다 (보통 150~300KB).
 */
export function compressImage(
  file: File,
  maxEdge = 1280,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("이미지를 처리할 수 없습니다."));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("이미지를 읽을 수 없습니다."));
    };

    img.src = url;
  });
}
