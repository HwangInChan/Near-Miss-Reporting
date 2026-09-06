"use client";

import { useCallback, useEffect, useState } from "react";
import { Lang, getDictionary } from "./i18n";

const LANG_STORAGE_KEY = "nearmiss.lang";

/**
 * 선택한 언어를 브라우저에 기억해두는 훅.
 *
 * 서버 렌더링 시점에는 localStorage가 없으므로 일단 "ko"로 렌더링한 뒤,
 * 클라이언트에서 저장된 값을 읽어 반영한다. isReady가 false인 동안에는
 * 화면을 그리지 않는 쪽이 깜빡임을 막는 데 유리하다.
 */
export function useLanguage() {
  const [lang, setLangState] = useState<Lang>("ko");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LANG_STORAGE_KEY) as Lang | null;
      if (stored === "ko" || stored === "en" || stored === "vi") {
        setLangState(stored);
      }
    } catch {
      // 저장소 접근이 막혀도 기본값(ko)으로 동작한다.
    }
    setIsReady(true);
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      // 무시
    }
  }, []);

  return { lang, setLang, isReady, t: getDictionary(lang) };
}
