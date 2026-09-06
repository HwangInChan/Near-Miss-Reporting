"use client";

import Link from "next/link";
import { Mic, LayoutDashboard } from "lucide-react";
import { useLanguage } from "@/lib/useLanguage";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";

export default function Home() {
  // 서버 렌더링 시점에는 저장된 언어를 알 수 없으므로 기본(ko)으로 먼저 그리고,
  // 마운트 후 저장된 언어로 교체된다. 여기서 null을 반환하면 초기 화면이
  // 통째로 빈 페이지가 되므로 그렇게 하지 않는다.
  const { lang, setLang, t } = useLanguage();

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center gap-10 bg-ink px-6 text-center">
      <LanguageSwitcher
        lang={lang}
        onChange={setLang}
        className="absolute right-5 top-5"
      />

      <div>
        <p className="mb-2 font-body text-xs uppercase tracking-widest text-safety-yellow">
          Near-miss &amp; Human Error Reporting
        </p>
        <h1 className="font-display text-4xl tracking-wide text-paper">{t.landingTitle}</h1>
        <p className="mt-3 max-w-md font-body text-sm text-steel-light">
          {t.landingSubtitle1} <br />
          {t.landingSubtitle2}
        </p>
      </div>

      <div className="flex w-full max-w-xl flex-col gap-4 sm:flex-row">
        <Link
          href="/report"
          className="flex flex-1 flex-col items-center gap-3 rounded-module border-2 border-safety-green bg-safety-green/10 px-6 py-10 transition-colors hover:bg-safety-green/20"
        >
          <Mic className="h-10 w-10 text-safety-green" />
          <span className="font-display text-xl tracking-wide text-paper">
            {t.workerCardTitle}
          </span>
          <span className="font-body text-xs text-steel-light">{t.workerCardDesc}</span>
        </Link>

        <Link
          href="/dashboard"
          className="flex flex-1 flex-col items-center gap-3 rounded-module border-2 border-safety-yellow bg-safety-yellow/10 px-6 py-10 transition-colors hover:bg-safety-yellow/20"
        >
          <LayoutDashboard className="h-10 w-10 text-safety-yellow" />
          <span className="font-display text-xl tracking-wide text-paper">
            {t.adminCardTitle}
          </span>
          <span className="font-body text-xs text-steel-light">{t.adminCardDesc}</span>
        </Link>
      </div>
    </main>
  );
}
