import type { Metadata } from "next";
import { Barlow_Condensed, Inter } from "next/font/google";
import "./globals.css";

const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-barlow",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "아차사고 리포팅 | Safety Command Center",
  description: "현장 아차사고를 3초 만에 보고하고, 인적 오류를 분석하여 중대재해를 예방합니다.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${barlow.variable} ${inter.variable}`}>
      <body className="bg-ink font-body text-paper antialiased">{children}</body>
    </html>
  );
}
