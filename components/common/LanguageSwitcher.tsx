"use client";

import { Languages } from "lucide-react";
import { Lang, LANGUAGES } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  lang: Lang;
  onChange: (lang: Lang) => void;
  className?: string;
}

/**
 * 작업자 화면용 언어 전환 버튼.
 * 한국 제조 현장은 외국인 근로자 비율이 높고 언어 장벽이 실제 사고 요인으로
 * 꼽히므로, 신고 화면에서 눈에 띄되 방해되지 않는 위치에 둔다.
 */
export function LanguageSwitcher({ lang, onChange, className }: LanguageSwitcherProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-module border border-steel-hairline bg-ink-softer p-1",
        className
      )}
    >
      <Languages className="ml-1 mr-0.5 h-3.5 w-3.5 shrink-0 text-steel-light" />
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => onChange(l.code)}
          aria-pressed={lang === l.code}
          className={cn(
            "rounded-[3px] px-2 py-1 font-body text-xs transition-colors",
            lang === l.code
              ? "bg-safety-yellow/15 text-safety-yellow"
              : "text-steel-light hover:text-paper"
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
