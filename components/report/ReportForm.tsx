"use client";

import { useEffect, useRef, useState } from "react";
import { MicButton } from "./MicButton";
import { PhotoUploader } from "./PhotoUploader";
import { LocationSelect } from "./LocationSelect";
import { SuccessOverlay } from "./SuccessOverlay";
import { submitReport } from "@/lib/utils";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";

type SubmitState = "idle" | "submitting" | "done" | "error";

export function ReportForm() {
  const {
    isSupported: speechSupported,
    isListening,
    transcript: speechTranscript,
    interimTranscript,
    error: speechError,
    start: startListening,
    stop: stopListening,
    reset: resetSpeech,
  } = useSpeechRecognition("ko-KR");

  // 실제 음성 인식 결과가 담기는, 사용자가 직접 수정할 수도 있는 텍스트
  const [editedTranscript, setEditedTranscript] = useState("");
  const [hasResult, setHasResult] = useState(false);
  const [zoneId, setZoneId] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [lastReportId, setLastReportId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // 음성 인식으로 확정된 문장이 들어올 때마다 편집 가능한 텍스트에 반영한다.
  useEffect(() => {
    if (speechTranscript) {
      setEditedTranscript(speechTranscript);
      setHasResult(true);
    }
  }, [speechTranscript]);

  const lastToggleAtRef = useRef(0);

  function handleMicToggle() {
    if (!speechSupported) return;
    // 너무 빠른 연타(더블클릭 등)로 인한 클릭 겹침을 화면 레벨에서도 한 번 더 막는다.
    const now = Date.now();
    if (now - lastToggleAtRef.current < 400) return;
    lastToggleAtRef.current = now;

    if (isListening) {
      stopListening();
    } else {
      resetSpeech();
      setEditedTranscript("");
      setHasResult(false);
      startListening();
    }
  }

  async function handleSubmit() {
    if (submitState === "submitting") return;
    setSubmitState("submitting");
    setErrorMessage("");

    try {
      // 실제 DB(app/api/reports)에 저장 → 관리자 대시보드에 즉시 반영된다.
      const report = await submitReport({
        zoneId,
        transcript: editedTranscript.trim(),
        photoAttached: photo !== null,
      });

      setLastReportId(report.id);
      setSubmitState("done");
      setTimeout(() => {
        setSubmitState("idle");
        setEditedTranscript("");
        setHasResult(false);
        resetSpeech();
        setZoneId("");
        setPhoto(null);
      }, 2200);
    } catch (err) {
      setSubmitState("error");
      setErrorMessage(err instanceof Error ? err.message : "제출 중 오류가 발생했습니다.");
    }
  }

  const canSubmit = editedTranscript.trim().length > 0 && zoneId !== "";
  // 녹음 중일 때는 지금까지 확정+중간 인식 결과를 미리 보여준다.
  const livePreview = isListening
    ? [editedTranscript, interimTranscript].filter(Boolean).join(" ")
    : editedTranscript;

  return (
    <div className="relative flex min-h-dvh flex-col bg-ink px-5 pb-8 pt-6">
      <SuccessOverlay visible={submitState === "done"} reportId={lastReportId} />

      <header className="mb-2">
        <p className="font-body text-xs uppercase tracking-widest text-safety-yellow">
          아차사고 신고
        </p>
        <h1 className="font-display text-3xl tracking-wide text-paper">
          지금 본 위험, 3초면 됩니다
        </h1>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 py-6">
        {speechSupported ? (
          <MicButton isRecording={isListening} onToggle={handleMicToggle} />
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-module border-2 border-steel bg-ink-softer p-5 text-center">
            <p className="font-display text-lg text-paper">이 브라우저는 음성 인식을 지원하지 않아요</p>
            <p className="max-w-[260px] font-body text-sm text-steel-light">
              Chrome 또는 Edge 브라우저로 열어주시면 음성으로 바로 신고할 수 있습니다. 지금은 아래
              칸에 직접 입력해주세요.
            </p>
          </div>
        )}

        {speechError && (
          <p className="w-full rounded-module border border-safety-red bg-safety-red/10 px-3 py-2 text-center font-body text-xs text-safety-red">
            {speechError}
          </p>
        )}

        {(hasResult || isListening || !speechSupported) && (
          <div className="w-full rounded-module border-2 border-steel bg-ink-softer p-4">
            <p className="mb-1 font-body text-xs text-steel-light">
              {isListening ? "인식 중… (실시간)" : "인식된 내용 (수정 가능)"}
            </p>
            <textarea
              value={isListening ? livePreview : editedTranscript}
              onChange={(e) => setEditedTranscript(e.target.value)}
              readOnly={isListening}
              placeholder="여기에 직접 입력할 수도 있어요"
              rows={3}
              className="w-full resize-none bg-transparent font-body text-base text-paper outline-none placeholder:text-steel-light"
            />
          </div>
        )}
      </div>

      {submitState === "error" && (
        <p className="mb-2 rounded-module border border-safety-red bg-safety-red/10 px-3 py-2 font-body text-sm text-safety-red">
          {errorMessage}
        </p>
      )}

      <div className="flex flex-col gap-3">
        <LocationSelect value={zoneId} onChange={setZoneId} />
        <PhotoUploader onChange={setPhoto} />

        <button
          type="button"
          disabled={!canSubmit || submitState === "submitting"}
          onClick={handleSubmit}
          className="mt-2 rounded-module bg-safety-green py-5 font-display text-xl tracking-wide text-ink transition-opacity disabled:opacity-30 active:scale-[0.98]"
        >
          {submitState === "submitting" ? "제출 중…" : "제출하기"}
        </button>
      </div>
    </div>
  );
}
