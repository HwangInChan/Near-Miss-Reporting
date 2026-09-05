"use client";

import { Check } from "lucide-react";

interface SuccessOverlayProps {
  visible: boolean;
  reportId: string;
}

export function SuccessOverlay({ visible, reportId }: SuccessOverlayProps) {
  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-ink/95"
    >
      <div className="flex h-24 w-24 animate-check-pop items-center justify-center rounded-full bg-safety-green">
        <Check className="h-14 w-14 text-ink" strokeWidth={3} />
      </div>
      <p className="font-display text-2xl tracking-wide text-paper">보고 완료</p>
      <p className="font-body text-sm text-steel-light">
        접수번호 <span className="text-paper">{reportId}</span> · 안전관리자에게 전달되었습니다
      </p>
    </div>
  );
}
