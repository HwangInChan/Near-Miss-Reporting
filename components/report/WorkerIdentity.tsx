"use client";

import { useState } from "react";
import { UserRound, Hash } from "lucide-react";
import { Worker } from "@/lib/types";
import { registerWorkerApi } from "@/lib/utils";

/**
 * 사번 등록 화면.
 * 이 기기에서 처음 사용할 때 한 번만 뜨고, 이후에는 localStorage에 기억되어
 * 다시 묻지 않는다 (공용 기기라면 상단 바의 "변경"으로 바꿔가며 쓸 수 있다).
 */
export function WorkerRegistration({ onRegistered }: { onRegistered: (w: Worker) => void }) {
  const [employeeId, setEmployeeId] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError("");
    try {
      const worker = await registerWorkerApi(employeeId.trim(), name.trim());
      onRegistered(worker);
    } catch (err) {
      setError(err instanceof Error ? err.message : "등록에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const canSubmit = employeeId.trim().length >= 2 && name.trim().length >= 1;

  return (
    <div className="flex min-h-dvh flex-col justify-center bg-ink px-5 py-8">
      <header className="mb-8">
        <p className="mb-1 font-body text-xs uppercase tracking-widest text-safety-yellow">
          아차사고 신고
        </p>
        <h1 className="font-display text-3xl tracking-wide text-paper">
          먼저 본인 확인을 해주세요
        </h1>
        <p className="mt-3 font-body text-sm text-steel-light">
          신고 건수를 집계해 포상에 반영하기 위해 사번이 필요합니다. <br />
          이 기기에서 한 번만 입력하면 다음부터는 묻지 않습니다.
        </p>
      </header>

      <div className="flex flex-col gap-3">
        <label className="flex items-center gap-3 rounded-module border-2 border-steel bg-ink-softer px-4 py-3">
          <Hash className="h-6 w-6 shrink-0 text-safety-yellow" />
          <input
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            placeholder="사번 (예: 10231)"
            className="w-full bg-transparent font-body text-base text-paper outline-none placeholder:text-steel-light"
          />
        </label>

        <label className="flex items-center gap-3 rounded-module border-2 border-steel bg-ink-softer px-4 py-3">
          <UserRound className="h-6 w-6 shrink-0 text-safety-yellow" />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름"
            className="w-full bg-transparent font-body text-base text-paper outline-none placeholder:text-steel-light"
          />
        </label>

        {error && (
          <p className="rounded-module border border-safety-red bg-safety-red/10 px-3 py-2 font-body text-sm text-safety-red">
            {error}
          </p>
        )}

        <button
          type="button"
          disabled={!canSubmit || isSubmitting}
          onClick={handleSubmit}
          className="mt-2 rounded-module bg-safety-green py-4 font-display text-lg tracking-wide text-ink transition-opacity disabled:opacity-30 active:scale-[0.98]"
        >
          {isSubmitting ? "확인 중…" : "시작하기"}
        </button>

        <p className="mt-2 text-center font-body text-xs text-steel-light">
          신고 내용은 관리자에게 전달되며, 개별 신고 건마다 익명으로 낼 수도 있습니다.
        </p>
      </div>
    </div>
  );
}

/** 신고 화면 상단에 현재 로그인된 작업자를 표시하는 바 */
export function WorkerBar({ worker, onChange }: { worker: Worker; onChange: () => void }) {
  return (
    <div className="mb-3 flex items-center justify-between rounded-module border border-steel-hairline bg-ink-softer px-3 py-2">
      <p className="font-body text-xs text-steel-light">
        <span className="text-paper">{worker.name}</span> ({worker.employeeId}) 님으로 신고합니다
      </p>
      <button
        type="button"
        onClick={onChange}
        className="shrink-0 font-body text-xs text-steel-light underline hover:text-paper"
      >
        변경
      </button>
    </div>
  );
}
