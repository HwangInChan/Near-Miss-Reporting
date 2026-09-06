"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Lock, ArrowLeft } from "lucide-react";

/**
 * 관리자 대시보드 진입 잠금.
 *
 * 인증 상태는 sessionStorage에 저장한다. localStorage와 달리 **탭을 닫으면
 * 자동으로 사라지므로**, 공용 PC에서 대시보드를 열어둔 채 자리를 떠도
 * 다음 사람이 그대로 이어받지 못한다.
 *
 * 한계: 이것은 화면 레벨의 접근 제어이지 실제 인증이 아니다. /api/reports 등
 * API는 여전히 공개되어 있어 주소를 아는 사람은 데이터를 조회할 수 있다.
 * 실제 운영에서는 각 API 라우트에서 서명된 세션 쿠키를 검사해야 한다.
 */

const SESSION_KEY = "nearmiss.admin";

export function useAdminGate() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    try {
      setIsUnlocked(window.sessionStorage.getItem(SESSION_KEY) === "1");
    } catch {
      // 저장소 접근이 막혀 있으면 잠긴 상태로 둔다.
    }
    setIsChecked(true);
  }, []);

  function unlock() {
    try {
      window.sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // 저장이 안 되면 이번 세션에서만 열린 상태로 동작한다.
    }
    setIsUnlocked(true);
  }

  function lock() {
    try {
      window.sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // 무시
    }
    setIsUnlocked(false);
  }

  return { isUnlocked, isChecked, unlock, lock };
}

export function AdminGate({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (isSubmitting || !password.trim()) return;
    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.ok) {
        onUnlock();
      } else {
        setError(data.error ?? "암호가 올바르지 않습니다.");
        setPassword("");
      }
    } catch {
      setError("확인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-ink px-5 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-safety-yellow bg-safety-yellow/10">
            <Lock className="h-6 w-6 text-safety-yellow" />
          </div>
          <div>
            <h1 className="font-display text-2xl tracking-wide text-paper">
              관리자 대시보드
            </h1>
            <p className="mt-1 font-body text-sm text-steel-light">
              신고자 정보가 포함되어 있어 암호가 필요합니다.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <input
            type="password"
            inputMode="numeric"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
            placeholder="관리자 암호"
            autoFocus
            className="w-full rounded-module border-2 border-steel bg-ink-softer px-4 py-3 text-center font-body text-lg tracking-widest text-paper outline-none placeholder:tracking-normal placeholder:text-steel-light focus:border-safety-yellow"
          />

          {error && (
            <p className="rounded-module border border-safety-red bg-safety-red/10 px-3 py-2 text-center font-body text-sm text-safety-red">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!password.trim() || isSubmitting}
            className="rounded-module bg-safety-yellow py-3.5 font-display text-lg tracking-wide text-ink transition-opacity disabled:opacity-30"
          >
            {isSubmitting ? "확인 중…" : "들어가기"}
          </button>

          <Link
            href="/"
            className="mt-2 flex items-center justify-center gap-1.5 font-body text-xs text-steel-light hover:text-paper"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            처음 화면으로
          </Link>
        </div>

        <p className="mt-8 text-center font-body text-[11px] leading-relaxed text-steel-light">
          탭을 닫으면 자동으로 다시 잠깁니다.
          <br />
          작업자 신고 화면은 암호 없이 이용할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
