"use client";

import { Mic, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface MicButtonProps {
  isRecording: boolean;
  onToggle: () => void;
}

/**
 * 화면 중앙의 큼직한 마이크 버튼.
 * 실제 음성 인식 API 연동 전, 녹음 중 상태를 펄스 링 애니메이션으로 표현한다.
 */
export function MicButton({ isRecording, onToggle }: MicButtonProps) {
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
          aria-label={isRecording ? "녹음 중지" : "음성으로 보고 시작"}
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
        {isRecording ? "듣고 있어요…" : "눌러서 말하기"}
      </p>
      <p className="max-w-[240px] text-center font-body text-sm text-steel-light">
        {isRecording ? (
          <>
            위험 상황을 말씀해 주세요.
            <br />
            다시 누르면 종료됩니다.
          </>
        ) : (
          <>
            3초면 충분합니다.
            <br />
            무엇을 보셨는지 편하게 말해주세요.
          </>
        )}
      </p>
    </div>
  );
}
