"use client";

import { Mic, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { Lang, getDictionary } from "@/lib/i18n";

interface MicButtonProps {
  isRecording: boolean;
  onToggle: () => void;
  lang: Lang;
}

/**
 * 화면 중앙의 큼직한 마이크 버튼.
 * 실제 음성 인식 API 연동 전, 녹음 중 상태를 펄스 링 애니메이션으로 표현한다.
 */
export function MicButton({ isRecording, onToggle, lang }: MicButtonProps) {
  const t = getDictionary(lang);
  return (
    <div className="relative flex flex-col items-center gap-4">
      <div className="relative flex h-44 w-44 items-center justify-center">
        {isRecording && (
          <>
            <span className="absolute inset-0 rounded-full bg-safety-red/40 animate-pulse-ring" />
            <span
              className="absolute inset-0 rounded-full bg-safety-red/40 animate-pulse-ring"
              style={{ animationDelay: "0.5s" }}
            />
          </>
        )}
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={isRecording}
          aria-label={isRecording ? t.listening : t.pressToSpeak}
          className={cn(
            "relative z-10 flex h-36 w-36 items-center justify-center rounded-full border-4 transition-transform active:scale-95",
            isRecording
              ? "border-safety-red bg-safety-red text-ink"
              : "border-safety-green bg-safety-green text-ink"
          )}
        >
          {isRecording ? (
            <Square className="h-12 w-12" strokeWidth={2.5} fill="currentColor" />
          ) : (
            <Mic className="h-16 w-16" strokeWidth={2} />
          )}
        </button>
      </div>
      <p className="font-display text-xl tracking-wide text-paper">
        {isRecording ? t.listening : t.pressToSpeak}
      </p>
      <p className="max-w-[260px] whitespace-pre-line text-center font-body text-sm text-steel-light">
        {isRecording ? t.listeningHint : t.pressHint}
      </p>
    </div>
  );
}
