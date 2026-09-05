import Link from "next/link";
import { Mic, LayoutDashboard } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-10 bg-ink px-6 text-center">
      <div>
        <p className="mb-2 font-body text-xs uppercase tracking-widest text-safety-yellow">
          Near-miss &amp; Human Error Reporting
        </p>
        <h1 className="font-display text-4xl tracking-wide text-paper">
          아차사고, 놓치지 않습니다
        </h1>
        <p className="mt-3 max-w-md font-body text-sm text-steel-light">
          작은 신호가 큰 사고를 막습니다. <br />역할을 선택해 프로토타입을 확인하세요.
        </p>
      </div>

      <div className="flex w-full max-w-xl flex-col gap-4 sm:flex-row">
        <Link
          href="/report"
          className="flex flex-1 flex-col items-center gap-3 rounded-module border-2 border-safety-green bg-safety-green/10 px-6 py-10 transition-colors hover:bg-safety-green/20"
        >
          <Mic className="h-10 w-10 text-safety-green" />
          <span className="font-display text-xl tracking-wide text-paper">작업자 화면</span>
          <span className="font-body text-xs text-steel-light">3초 음성 리포팅 (모바일)</span>
        </Link>

        <Link
          href="/dashboard"
          className="flex flex-1 flex-col items-center gap-3 rounded-module border-2 border-safety-yellow bg-safety-yellow/10 px-6 py-10 transition-colors hover:bg-safety-yellow/20"
        >
          <LayoutDashboard className="h-10 w-10 text-safety-yellow" />
          <span className="font-display text-xl tracking-wide text-paper">관리자 대시보드</span>
          <span className="font-body text-xs text-steel-light">분석 · 예측 (데스크탑)</span>
        </Link>
      </div>
    </main>
  );
}
