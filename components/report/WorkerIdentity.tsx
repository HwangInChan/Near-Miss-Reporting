"use client";

import { useState } from "react";
import { UserRound, Hash } from "lucide-react";
import { Worker } from "@/lib/types";
import { Lang, getDictionary } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import { registerWorkerApi } from "@/lib/api";

/**
 * 사번 등록 화면.
 * 이 기기에서 처음 사용할 때 한 번만 뜨고, 이후에는 localStorage에 기억되어
 * 다시 묻지 않는다 (공용 기기라면 상단 바의 "변경"으로 바꿔가며 쓸 수 있다).
 */
export function WorkerRegistration({
  onRegistered,
  lang,
  onLangChange,
}: {
  onRegistered: (w: Worker) => void;
  lang: Lang;
  onLangChange: (l: Lang) => void;
}) {
  const t = getDictionary(lang);
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
      setError(err instanceof Error ? err.message : t.registerFailed);
    } finally {
      setIsSubmitting(false);
    }
  }

  const canSubmit = employeeId.trim().length >= 2 && name.trim().length >= 1;

  return (
    <div className="flex min-h-dvh flex-col justify-center bg-ink px-5 py-8">
      <LanguageSwitcher lang={lang} onChange={onLangChange} className="mb-6 self-start" />

      <header className="mb-8">
        <p className="mb-1 font-body text-xs uppercase tracking-widest text-safety-yellow">
          {t.appEyebrow}
        </p>
        <h1 className="font-display text-3xl tracking-wide text-paper">{t.registerTitle}</h1>
        <p className="mt-3 font-body text-sm text-steel-light">
          {t.registerDesc1} <br />
          {t.registerDesc2}
        </p>
      </header>

      <div className="flex flex-col gap-3">
        <label className="flex items-center gap-3 rounded-module border-2 border-steel bg-ink-softer px-4 py-3">
          <Hash className="h-6 w-6 shrink-0 text-safety-yellow" />
          <input
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            placeholder={t.employeeIdPlaceholder}
            className="w-full bg-transparent font-body text-base text-paper outline-none placeholder:text-steel-light"
          />
        </label>

        <label className="flex items-center gap-3 rounded-module border-2 border-steel bg-ink-softer px-4 py-3">
          <UserRound className="h-6 w-6 shrink-0 text-safety-yellow" />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.namePlaceholder}
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
          {isSubmitting ? t.checking : t.start}
        </button>

        <p className="mt-2 text-center font-body text-xs text-steel-light">
          {t.registerFooter}
        </p>
      </div>
    </div>
  );
}

/** 신고 화면 상단에 현재 로그인된 작업자를 표시하는 바 */
export function WorkerBar({
  worker,
  onChange,
  lang,
}: {
  worker: Worker;
  onChange: () => void;
  lang: Lang;
}) {
  const t = getDictionary(lang);
  return (
    <div className="mb-3 flex items-center justify-between gap-2 rounded-module border border-steel-hairline bg-ink-softer px-3 py-2">
      <p className="min-w-0 font-body text-xs text-steel-light">
        <span className="text-paper">{worker.name}</span> ({worker.employeeId}) {t.reportingAs}
      </p>
      <button
        type="button"
        onClick={onChange}
        className="shrink-0 font-body text-xs text-steel-light underline hover:text-paper"
      >
        {t.change}
      </button>
    </div>
  );
}
