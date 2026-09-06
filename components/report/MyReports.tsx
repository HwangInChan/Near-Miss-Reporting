"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Award, Star } from "lucide-react";
import { NearMissReport, Worker } from "@/lib/types";
import { FACTORY_ZONES } from "@/lib/constants";
import { fetchMyReports, formatRelativeTime, loadStoredWorker } from "@/lib/utils";
import { SeverityBadge, StatusBadge } from "@/components/common/Badge";

/**
 * 작업자 본인의 신고 이력 화면.
 * "내 신고가 어떻게 처리됐는지"를 보여주는 피드백 루프가 있어야
 * 다음 신고로 이어진다는 안전문화 관점에서 추가한 화면이다.
 */
export function MyReports() {
  const [worker, setWorker] = useState<Worker | null>(null);
  const [reports, setReports] = useState<NearMissReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const stored = loadStoredWorker();
    setWorker(stored);
    if (!stored) {
      setIsLoading(false);
      return;
    }
    fetchMyReports(stored.employeeId)
      .then(setReports)
      .catch((err) =>
        setErrorMessage(err instanceof Error ? err.message : "이력을 불러오지 못했습니다.")
      )
      .finally(() => setIsLoading(false));
  }, []);

  const resolvedCount = reports.filter((r) => r.status === "조치완료").length;
  const exemplaryCount = reports.filter((r) => r.isExemplary).length;

  return (
    <div className="flex min-h-dvh flex-col bg-ink px-5 pb-8 pt-6">
      <header className="mb-5">
        <Link
          href="/report"
          className="mb-3 inline-flex items-center gap-1.5 font-body text-xs text-steel-light hover:text-paper"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          신고 화면으로
        </Link>
        <h1 className="font-display text-3xl tracking-wide text-paper">내 신고 이력</h1>
        {worker && (
          <p className="mt-1 font-body text-sm text-steel-light">
            {worker.name} ({worker.employeeId})
          </p>
        )}
      </header>

      {!worker ? (
        <p className="py-16 text-center font-body text-sm text-steel-light">
          아직 사번이 등록되지 않았습니다.
          <br />
          신고 화면에서 먼저 본인 확인을 해주세요.
        </p>
      ) : isLoading ? (
        <p className="py-16 text-center font-body text-sm text-steel-light">불러오는 중…</p>
      ) : (
        <>
          {errorMessage && (
            <p className="mb-4 rounded-module border border-safety-red bg-safety-red/10 px-3 py-2 font-body text-sm text-safety-red">
              {errorMessage}
            </p>
          )}

          {/* 포상 집계 현황 */}
          <div className="mb-5 grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center rounded-module border border-steel-hairline bg-ink-softer py-3">
              <span className="font-body text-[11px] text-steel-light">누적 신고</span>
              <span className="font-display text-2xl text-paper">{reports.length}</span>
            </div>
            <div className="flex flex-col items-center rounded-module border border-steel-hairline bg-ink-softer py-3">
              <span className="font-body text-[11px] text-steel-light">조치완료</span>
              <span className="font-display text-2xl text-safety-green">{resolvedCount}</span>
            </div>
            <div className="flex flex-col items-center rounded-module border border-steel-hairline bg-ink-softer py-3">
              <span className="flex items-center gap-1 font-body text-[11px] text-steel-light">
                <Award className="h-3 w-3" />
                우수 신고
              </span>
              <span className="font-display text-2xl text-safety-yellow">{exemplaryCount}</span>
            </div>
          </div>

          <p className="mb-4 rounded-module border border-steel-hairline bg-ink-softer px-3 py-2 font-body text-xs text-steel-light">
            익명으로 제출한 신고는 이 목록과 포상 집계에 포함되지 않습니다.
          </p>

          {reports.length === 0 ? (
            <p className="py-16 text-center font-body text-sm text-steel-light">
              아직 기명으로 접수한 신고가 없습니다.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {reports.map((r) => {
                const zone = FACTORY_ZONES.find((z) => z.id === r.zoneId);
                return (
                  <li
                    key={r.id}
                    className="rounded-module border border-steel-hairline bg-ink-softer px-3 py-2.5"
                  >
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 font-body text-xs text-steel-light">
                        {r.id}
                        {r.isExemplary && (
                          <span className="flex items-center gap-1 rounded-module border border-safety-yellow bg-safety-yellow/10 px-1.5 py-0.5 text-[10px] font-semibold text-safety-yellow">
                            <Star className="h-2.5 w-2.5" />
                            우수 신고
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 font-body text-xs text-steel-light">
                        {formatRelativeTime(r.createdAt)}
                      </span>
                    </div>
                    <p className="mb-2 font-body text-sm text-paper">{r.transcript}</p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <SeverityBadge severity={r.severity} />
                      <StatusBadge status={r.status} />
                      <span className="font-body text-xs text-steel-light">{zone?.label}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
