"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { EyeOff, History } from "lucide-react";
import { MicButton } from "./MicButton";
import { PhotoUploader } from "./PhotoUploader";
import { LocationSelect } from "./LocationSelect";
import { SuccessOverlay } from "./SuccessOverlay";
import { WorkerRegistration, WorkerBar } from "./WorkerIdentity";
import { Worker } from "@/lib/types";
import { useLanguage } from "@/lib/useLanguage";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import {
  submitReport,
  loadStoredWorker,
  saveStoredWorker,
  clearStoredWorker,
} from "@/lib/utils";
import { useSpeechRecognition } from "@/lib/useSpeechRecognition";

type SubmitState = "idle" | "submitting" | "done" | "error";

export function ReportForm() {
  const { lang, setLang, t } = useLanguage();

  const {
    isSupported: speechSupported,
    isListening,
    transcript: speechTranscript,
    interimTranscript,
    error: speechError,
    start: startListening,
    stop: stopListening,
    reset: resetSpeech,
  } = useSpeechRecognition(lang);

  // 이 기기에 기억된 작업자. null이면 사번 등록 화면을 먼저 보여준다.
  const [worker, setWorker] = useState<Worker | null>(null);
  const [isWorkerLoaded, setIsWorkerLoaded] = useState(false);
  // 이번 건만 익명으로 낼지 여부 (익명이면 포상 집계에서 제외됨)
  const [isAnonymous, setIsAnonymous] = useState(false);

  // localStorage는 브라우저에만 있으므로 클라이언트에서 읽는다.
  useEffect(() => {
    setWorker(loadStoredWorker());
    setIsWorkerLoaded(true);
  }, []);

  // 신고 내용. 음성 인식 결과와 직접 타이핑 양쪽 모두 여기에 담긴다.
  const [editedTranscript, setEditedTranscript] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [lastReportId, setLastReportId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // 녹음을 시작한 시점에 이미 입력되어 있던 텍스트. 음성 인식 결과는 이 뒤에
  // 덧붙인다 (사용자가 직접 타이핑해둔 내용을 덮어쓰지 않기 위함).
  const baseTextRef = useRef("");

  // 음성 인식으로 확정된 문장이 들어올 때마다 신고 내용에 반영한다.
  useEffect(() => {
    if (speechTranscript) {
      const base = baseTextRef.current;
      setEditedTranscript(base ? `${base} ${speechTranscript}` : speechTranscript);
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
      // 이미 입력해둔 내용은 지우지 않고, 그 뒤에 이어서 받아적는다.
      baseTextRef.current = editedTranscript.trim();
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
        employeeId: worker?.employeeId,
        isAnonymous,
      });

      setLastReportId(report.id);
      setSubmitState("done");
      setTimeout(() => {
        setSubmitState("idle");
        setEditedTranscript("");
        baseTextRef.current = "";
        resetSpeech();
        setZoneId("");
        setPhoto(null);
        setIsAnonymous(false);
      }, 2200);
    } catch (err) {
      setSubmitState("error");
      setErrorMessage(err instanceof Error ? err.message : t.submitFailed);
    }
  }

  const canSubmit = editedTranscript.trim().length > 0 && zoneId !== "";

  function handleRegistered(w: Worker) {
    saveStoredWorker(w);
    setWorker(w);
  }

  function handleChangeWorker() {
    clearStoredWorker();
    setWorker(null);
  }

  // localStorage는 브라우저에만 있으므로 서버 렌더링 시점에는 등록 여부를 알 수 없다.
  // 이때 null을 반환하면 화면이 통째로 백지가 되므로, 최소한의 로딩 표시를 둔다.
  if (!isWorkerLoaded) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-ink">
        <p className="font-body text-sm text-steel-light">{t.loading}</p>
      </div>
    );
  }

  if (!worker) {
    return <WorkerRegistration onRegistered={handleRegistered} lang={lang} onLangChange={setLang} />;
  }

  return (
    <div className="relative flex min-h-dvh flex-col bg-ink px-5 pb-8 pt-6">
      <SuccessOverlay visible={submitState === "done"} reportId={lastReportId} lang={lang} />

      <LanguageSwitcher lang={lang} onChange={setLang} className="mb-3 self-start" />

      <WorkerBar worker={worker} onChange={handleChangeWorker} lang={lang} />

      <header className="mb-2 flex items-start justify-between gap-3">
        <div>
          <p className="font-body text-xs uppercase tracking-widest text-safety-yellow">
            {t.appEyebrow}
          </p>
          <h1 className="font-display text-3xl tracking-wide text-paper">{t.reportTitle}</h1>
        </div>
        <Link
          href="/my-reports"
          className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-module border border-steel-hairline bg-ink-softer px-3 py-2 font-body text-xs text-steel-light hover:text-paper"
        >
          <History className="h-3.5 w-3.5" />
          {t.myReports}
        </Link>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 py-6">
        {speechSupported ? (
          <MicButton isRecording={isListening} onToggle={handleMicToggle} lang={lang} />
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-module border-2 border-steel bg-ink-softer p-5 text-center">
            <p className="font-display text-lg text-paper">{t.micUnsupportedTitle}</p>
            <p className="max-w-[260px] font-body text-sm text-steel-light">
              {t.micUnsupportedDesc}
            </p>
          </div>
        )}

        {speechError && (
          <p className="w-full rounded-module border border-safety-red bg-safety-red/10 px-3 py-2 text-center font-body text-xs text-safety-red">
            {speechError}
          </p>
        )}

        {/* 입력칸은 항상 보이고, 항상 직접 타이핑할 수 있다.
            (예전에는 마이크를 한 번 눌러야 나타나고, 녹음 중에는 readOnly라
             음성 인식이 안 되는 환경에서 수기 입력이 아예 불가능했다.) */}
        <div className="w-full rounded-module border-2 border-steel bg-ink-softer p-4">
          <p className="mb-1 font-body text-xs text-steel-light">
            {t.reportContent} {speechSupported ? t.viaVoiceOrType : t.viaTypeOnly}
          </p>
          <textarea
            value={editedTranscript}
            onChange={(e) => setEditedTranscript(e.target.value)}
            placeholder={t.contentPlaceholder}
            rows={3}
            className="w-full resize-none bg-transparent font-body text-base text-paper outline-none placeholder:text-steel-light"
          />
          {/* 녹음 중 실시간 인식 결과는 입력칸에 직접 쓰지 않고 아래에 미리 보여준다.
              그래야 사용자가 타이핑 중인 내용을 덮어쓰지 않는다. */}
          {isListening && interimTranscript && (
            <p className="mt-2 border-t border-steel-hairline pt-2 font-body text-sm text-steel-light">
              {t.recognizing} {interimTranscript}
            </p>
          )}
        </div>
      </div>

      {submitState === "error" && (
        <p className="mb-2 rounded-module border border-safety-red bg-safety-red/10 px-3 py-2 font-body text-sm text-safety-red">
          {errorMessage}
        </p>
      )}

      <div className="flex flex-col gap-3">
        <LocationSelect value={zoneId} onChange={setZoneId} lang={lang} />
        <PhotoUploader onChange={setPhoto} lang={lang} />

        {/* 익명 신고 토글.
            익명으로 내면 사번이 저장되지 않아 포상 집계에서 빠진다는 점을
            체크하는 순간 화면에 명시해서, 사용자가 트레이드오프를 알고 고르게 한다. */}
        <label
          className={
            isAnonymous
              ? "flex cursor-pointer items-start gap-3 rounded-module border-2 border-safety-yellow bg-safety-yellow/10 px-4 py-3"
              : "flex cursor-pointer items-start gap-3 rounded-module border-2 border-steel bg-ink-softer px-4 py-3"
          }
        >
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 accent-safety-yellow"
          />
          <span className="flex flex-col gap-0.5">
            <span className="flex items-center gap-1.5 font-body text-base text-paper">
              <EyeOff className="h-4 w-4" />
              {t.anonymousLabel}
            </span>
            <span className="font-body text-xs text-steel-light">
              {isAnonymous ? t.anonymousOn : t.anonymousOff}
            </span>
          </span>
        </label>

        <button
          type="button"
          disabled={!canSubmit || submitState === "submitting"}
          onClick={handleSubmit}
          className="mt-2 rounded-module bg-safety-green py-5 font-display text-xl tracking-wide text-ink transition-opacity disabled:opacity-30 active:scale-[0.98]"
        >
          {submitState === "submitting" ? t.submitting : t.submit}
        </button>
      </div>
    </div>
  );
}
