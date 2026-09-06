"use client";

import { Check } from "lucide-react";
import { Lang, getDictionary } from "@/lib/i18n";

interface SuccessOverlayProps {
  visible: boolean;
  reportId: string;
  lang: Lang;
}

export function SuccessOverlay({ visible, reportId, lang }: SuccessOverlayProps) {
  const t = getDictionary(lang);
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
      <p className="font-display text-2xl tracking-wide text-paper">{t.submitDone}</p>
      <p className="text-center font-body text-sm text-steel-light">
        {t.receiptNo} <span className="text-paper">{reportId}</span>
        <br />
        {t.deliveredToManager}
      </p>
    </div>
  );
}
