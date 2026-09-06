"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { NearMissReport, RewardRanking } from "@/lib/types";
import {
  aggregateHeatmap,
  countByHumanError,
  fetchFactorStats,
  fetchReports,
  fetchRewardRankings,
  patchReport,
} from "@/lib/utils";
import { NEAR_MISS_ALERT_THRESHOLD } from "@/lib/constants";
import { PanelCard } from "@/components/common/PanelCard";
import { ReportList } from "./ReportList";
import { ReportDetailPanel } from "./ReportDetailPanel";
import { HeinrichPyramid } from "@/components/analytics/HeinrichPyramid";
import { ThresholdAlertWidget } from "@/components/analytics/ThresholdAlertWidget";
import { RiskHeatmap } from "@/components/analytics/RiskHeatmap";
import { ErrorTypeDonutChart } from "@/components/analytics/ErrorTypeDonutChart";
import { RewardRankingPanel } from "./RewardRankingPanel";
import { ContributingFactorChart } from "@/components/analytics/ContributingFactorChart";
import { RefreshCw } from "lucide-react";

// 작업자 화면에서 새 리포트가 접수되는 것을 "실시간처럼" 반영하기 위한 폴링 주기.
// 실제 서비스에서는 웹소켓/SSE로 교체하는 것을 권장한다.
const POLL_INTERVAL_MS = 8000;

export function DashboardClient() {
  const [reports, setReports] = useState<NearMissReport[]>([]);
  const [rankings, setRankings] = useState<RewardRanking[]>([]);
  const [factorStats, setFactorStats] = useState<{ factor: string; count: number }[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadReports = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setIsRefreshing(true);
    try {
      const [data, rankingData, factorData] = await Promise.all([
        fetchReports(),
        fetchRewardRankings(),
        fetchFactorStats(),
      ]);
      setReports(data);
      setRankings(rankingData);
      setFactorStats(factorData);
      setErrorMessage("");
      // 주의: 여기서 첫 리포트를 자동으로 선택하지 않는다.
      // 예전에는 setSelectedId((prev) => prev ?? data[0]?.id ?? null) 로
      // "아직 아무것도 선택 안 했으면 첫 항목을 자동 선택"했는데, 이 때문에
      // 대시보드에 처음 들어오자마자 근본 원인 분석 패널이 항상 열려 있었다.
      // 사용자가 목록에서 직접 클릭하기 전까지는 selectedId를 그대로 둔다
      // (초기값 null → ReportDetailPanel이 빈 상태 안내를 보여줌).
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "리포트를 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
    // 작업자 화면에서의 신규 제출을 대시보드가 주기적으로 감지하도록 폴링한다.
    const interval = setInterval(() => loadReports({ silent: true }), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadReports]);

  const selectedReport = reports.find((r) => r.id === selectedId) ?? null;

  async function handleUpdate(id: string, patch: Partial<NearMissReport>) {
    // 낙관적 업데이트: 먼저 화면에 반영하고, 실패하면 서버 데이터로 되돌린다.
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    try {
      const updated = await patchReport(id, {
        status: patch.status,
        humanErrorType: patch.humanErrorType,
        contributingFactors: patch.contributingFactors,
        isExemplary: patch.isExemplary,
        severity: patch.severity,
      });
      setReports((prev) => prev.map((r) => (r.id === id ? updated : r)));
      // 조치완료 여부·우수 신고 지정은 포상 집계에 영향을 주므로 순위도 다시 불러온다.
      if (patch.status !== undefined || patch.isExemplary !== undefined) {
        fetchRewardRankings().then(setRankings).catch(() => {
          /* 순위 갱신 실패는 조용히 무시 - 다음 폴링에서 다시 시도된다 */
        });
      }
      // 배후 요인 태깅이 바뀌면 집계 차트도 갱신한다.
      if (patch.contributingFactors !== undefined) {
        fetchFactorStats().then(setFactorStats).catch(() => {
          /* 무시 - 다음 폴링에서 갱신된다 */
        });
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "저장에 실패했습니다.");
      loadReports({ silent: true });
    }
  }

  const heatmapCells = useMemo(() => aggregateHeatmap(reports), [reports]);
  const errorTypeData = useMemo(() => countByHumanError(reports), [reports]);

  return (
    <div className="min-h-dvh bg-ink px-4 py-5 sm:px-6 sm:py-6">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-body text-xs uppercase tracking-widest text-safety-yellow">
            Safety Command Center
          </p>
          <h1 className="font-display text-3xl tracking-wide text-paper">
            아차사고 · 인적오류 대시보드
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <p className="whitespace-nowrap font-body text-sm text-steel-light">
            누적 접수 <span className="text-paper">{reports.length}</span>건
          </p>
          <button
            type="button"
            onClick={() => loadReports()}
            className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-module border border-steel-hairline bg-ink-softer px-3 py-1.5 font-body text-xs text-steel-light hover:text-paper"
          >
            <RefreshCw className={isRefreshing ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
            새로고침
          </button>
        </div>
      </header>

      {errorMessage && (
        <p className="mb-4 rounded-module border border-safety-red bg-safety-red/10 px-3 py-2 font-body text-sm text-safety-red">
          {errorMessage}
        </p>
      )}

      {isLoading ? (
        <p className="py-20 text-center font-body text-steel-light">리포트를 불러오는 중…</p>
      ) : (
        <>
          {/* 경보·예측·분포 위젯 4종 - 넓은 화면에서 한 줄, 좁아지면 자동으로 줄바꿈 */}
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <PanelCard title="임계점 경보" subtitle={`아차사고 ${NEAR_MISS_ALERT_THRESHOLD}건 도달 시 점등`}>
              <ThresholdAlertWidget reports={reports} />
            </PanelCard>
            <PanelCard title="하인리히 1:29:300" subtitle="아차사고 기반 사고 예측">
              <HeinrichPyramid nearMissCount={reports.length} />
            </PanelCard>
            <PanelCard title="인적 오류 유형 비율" subtitle="분류 완료 건 기준" centerContent>
              <ErrorTypeDonutChart data={errorTypeData} />
            </PanelCard>
            <PanelCard title="구역별 위험도 히트맵" subtitle="공장 도면 격자 · 진할수록 다발 구역">
              <RiskHeatmap cells={heatmapCells} />
            </PanelCard>
          </div>

          {/* Row 3: 리포트 리스트 + 상세 분석 */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
            <PanelCard title="접수된 리포트" subtitle="클릭하여 상세 분석으로 이동">
              {reports.length === 0 ? (
                <p className="py-10 text-center font-body text-sm text-steel-light">
                  아직 접수된 리포트가 없습니다.
                </p>
              ) : (
                <ReportList reports={reports} selectedId={selectedId} onSelect={setSelectedId} />
              )}
            </PanelCard>
            <PanelCard title="근본 원인 분석" subtitle="인적 오류 분류 · 배후 요인 태깅">
              <ReportDetailPanel report={selectedReport} onUpdate={handleUpdate} />
            </PanelCard>
          </div>

          {/* Row 4: 배후 요인 집계 + 포상 집계 */}
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <PanelCard
              title="배후 요인 순위"
              subtitle="태깅된 잠재 조건 · 많은 순"
            >
              <ContributingFactorChart stats={factorStats} />
            </PanelCard>
            <PanelCard
              title="신고 포상 집계"
              subtitle="기명 신고 기준 · 우수 신고 수 우선 정렬"
            >
              <RewardRankingPanel rankings={rankings} />
            </PanelCard>
          </div>
        </>
      )}
    </div>
  );
}
