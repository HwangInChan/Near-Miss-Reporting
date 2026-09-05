"use client";

import { NearMissReport, HumanErrorType, ContributingFactor } from "@/lib/types";
import { FACTORY_ZONES } from "@/lib/constants";
import { formatDateTime, toggleResolvedStatus } from "@/lib/utils";
import { SeverityBadge, StatusBadge } from "@/components/common/Badge";
import { HumanErrorTagger } from "./HumanErrorTagger";
import { ContributingFactors } from "./ContributingFactors";
import { Camera, MapPin, User, RotateCcw, CheckCircle2 } from "lucide-react";

interface ReportDetailPanelProps {
  report: NearMissReport | null;
  onUpdate: (id: string, patch: Partial<NearMissReport>) => void;
}

export function ReportDetailPanel({ report, onUpdate }: ReportDetailPanelProps) {
  if (!report) {
    return (
      <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-2 text-center">
        <p className="font-display text-lg text-steel-light">
          왼쪽 목록에서 리포트를 선택하세요
        </p>
        <p className="font-body text-sm text-steel-light">
          인적 오류 유형과 배후 요인을 태깅해 근본 원인을 분석할 수 있습니다
        </p>
      </div>
    );
  }

  const zone = FACTORY_ZONES.find((z) => z.id === report.zoneId);

  function setHumanError(type: HumanErrorType) {
    onUpdate(report!.id, { humanErrorType: type });
  }

  function setFactors(factors: ContributingFactor[]) {
    onUpdate(report!.id, { contributingFactors: factors });
  }

  function toggleResolved() {
    onUpdate(report!.id, { status: toggleResolvedStatus(report!.status) });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 리포트 원문 */}
      <div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="font-body text-sm text-steel-light">{report.id}</span>
          <SeverityBadge severity={report.severity} />
          <StatusBadge status={report.status} />
        </div>
        <p className="mb-3 rounded-module border border-steel-hairline bg-ink-softer p-4 font-body text-base leading-relaxed text-paper">
          “{report.transcript}”
        </p>
        <div className="flex flex-wrap gap-x-5 gap-y-1.5 font-body text-xs text-steel-light">
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" /> {zone?.label}
          </span>
          <span className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5" /> {report.reporterAlias}
          </span>
          <span>{formatDateTime(report.createdAt)}</span>
          {report.photoAttached && (
            <span className="flex items-center gap-1.5">
              <Camera className="h-3.5 w-3.5" /> 사진 첨부됨
            </span>
          )}
        </div>
      </div>

      {/* 인적 오류 분류 */}
      <div>
        <h3 className="mb-2 font-display text-base tracking-wide text-paper">
          인적 오류 분류
        </h3>
        <HumanErrorTagger value={report.humanErrorType} onChange={setHumanError} />
      </div>

      {/* 배후 요인 */}
      <div>
        <h3 className="mb-2 font-display text-base tracking-wide text-paper">
          배후 요인 (복수 선택)
        </h3>
        <ContributingFactors value={report.contributingFactors} onChange={setFactors} />
      </div>

      <button
        type="button"
        onClick={toggleResolved}
        className={
          report.status === "조치완료"
            ? "mt-2 flex items-center justify-center gap-2 rounded-module border-2 border-steel bg-ink-softer py-3 font-display text-base tracking-wide text-steel-light"
            : "mt-2 flex items-center justify-center gap-2 rounded-module bg-safety-green py-3 font-display text-base tracking-wide text-ink"
        }
      >
        {report.status === "조치완료" ? (
          <>
            <RotateCcw className="h-4 w-4" /> 조치완료 번복하기
          </>
        ) : (
          <>
            <CheckCircle2 className="h-4 w-4" /> 조치완료 처리
          </>
        )}
      </button>
    </div>
  );
}
