import type { Config } from "tailwindcss";

/**
 * 디자인 토큰
 * - ink / paper : 고대비를 위한 기본 배경 (다크 / 라이트)
 * - safety-* : 신호등 3색. 반드시 "상태"를 의미할 때만 사용한다 (장식 금지).
 * - steel : 제어반 모듈 느낌의 보더/구분선 컬러
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0B0E11",
          soft: "#171B1F",
          softer: "#22272C",
        },
        paper: {
          DEFAULT: "#F2F4F5",
          card: "#FFFFFF",
        },
        steel: {
          DEFAULT: "#495057",
          light: "#9AA3AB",
          hairline: "#2A2F34",
        },
        safety: {
          green: "#22C55E",
          greenDim: "#14532D",
          yellow: "#FFC107",
          yellowDim: "#7A5B00",
          red: "#E53935",
          redDim: "#7A1F1C",
        },
      },
      fontFamily: {
        display: ["var(--font-barlow)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
      borderRadius: {
        module: "4px",
      },
      boxShadow: {
        module: "0 1px 0 rgba(0,0,0,0.4)",
      },
      animation: {
        "pulse-ring": "pulse-ring 1.4s cubic-bezier(0.4,0,0.6,1) infinite",
        "check-pop": "check-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards",
      },
      keyframes: {
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "70%": { transform: "scale(1.6)", opacity: "0" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
        "check-pop": {
          "0%": { transform: "scale(0)", opacity: "0" },
          "60%": { transform: "scale(1.15)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
