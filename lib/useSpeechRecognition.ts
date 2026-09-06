"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Lang, SPEECH_LANG, getDictionary } from "./i18n";

/**
 * 브라우저 내장 Web Speech API를 감싸는 커스텀 훅.
 *
 * 설계 방침이 이전 버전과 다르다: "지금 인식이 시작된 상태인지"를 정확히
 * 추적해서 중복 호출을 막으려던 시도(ref 플래그, 지연 생성 등)가 이 환경에서는
 * 계속 InvalidStateError로 어긋났다. 그래서 상태 추적 자체를 포기하고,
 * 마이크를 누를 때마다 "기존에 뭐가 있었든 일단 무조건 폐기하고 완전히 새
 * SpeechRecognition 객체로 시작"하는 방식으로 바꿨다. 이전 세션이 진짜
 * 시작된 상태였든 아니든, abort()는 항상 안전하게 호출할 수 있으므로
 * "이미 시작된 상태인가?"라는 판단 자체가 필요 없어진다.
 */

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
  length: number;
}

interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
}

interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  }
}

function describeError(code: string, lang: Lang): string {
  const d = getDictionary(lang);
  switch (code) {
    case "not-allowed":
    case "permission-denied":
      return d.errPermission;
    case "no-speech":
      return d.errNoSpeech;
    case "network":
      return d.errNetwork;
    case "audio-capture":
      return d.errAudioCapture;
    case "aborted":
      return ""; // 사용자가 직접 멈춘 경우는 에러로 취급하지 않는다
    default:
      return d.errUnknown;
  }
}

function getCtor(): SpeechRecognitionCtor | undefined {
  if (typeof window === "undefined") return undefined;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition;
}

function destroy(recognition: SpeechRecognitionLike | null) {
  if (!recognition) return;
  recognition.onresult = null;
  recognition.onerror = null;
  recognition.onend = null;
  try {
    recognition.abort();
  } catch {
    // 이미 끝난 객체에 abort()를 불러도 무시한다.
  }
}

export interface UseSpeechRecognitionResult {
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

export function useSpeechRecognition(lang: Lang = "ko"): UseSpeechRecognitionResult {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const receivedAnyResultRef = useRef(false);

  useEffect(() => {
    setIsSupported(Boolean(getCtor()));
    return () => destroy(recognitionRef.current);
  }, []);

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor) {
      setError(getDictionary(lang).errUnsupported);
      return;
    }

    // 기존에 뭐가 남아있었든(진짜 시작된 상태였든, 어중간한 상태였든) 무조건
    // 폐기하고 완전히 새 인스턴스로 시작한다 - "이미 시작됐는지" 판단이 필요없다.
    destroy(recognitionRef.current);
    recognitionRef.current = null;

    let recognition: SpeechRecognitionLike;
    try {
      recognition = new Ctor();
    } catch (e) {
      console.error("[useSpeechRecognition] SpeechRecognition 생성 실패:", e);
      setError(getDictionary(lang).errStartFailed);
      return;
    }

    recognition.lang = SPEECH_LANG[lang];
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      receivedAnyResultRef.current = true;
      let finalChunk = "";
      let interimChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalChunk += result[0].transcript;
        } else {
          interimChunk += result[0].transcript;
        }
      }
      if (finalChunk) {
        setTranscript((prev) => (prev ? `${prev} ${finalChunk}` : finalChunk).trim());
      }
      setInterimTranscript(interimChunk);
    };

    recognition.onerror = (event) => {
      console.error("[useSpeechRecognition] onerror:", event.error);
      const message = describeError(event.error, lang);
      if (message) setError(message);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
      if (!receivedAnyResultRef.current) {
        setError(getDictionary(lang).errNoResult);
      }
    };

    recognitionRef.current = recognition;
    setError(null);
    setInterimTranscript("");
    receivedAnyResultRef.current = false;

    try {
      recognition.start();
      setIsListening(true);
    } catch (e) {
      console.error("[useSpeechRecognition] start() 실패:", e);
      setError(getDictionary(lang).errStartFailed);
      setIsListening(false);
    }
  }, [lang]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const reset = useCallback(() => {
    setTranscript("");
    setInterimTranscript("");
    setError(null);
  }, []);

  return { isSupported, isListening, transcript, interimTranscript, error, start, stop, reset };
}
