"use client";

import { ZoneRiskAssessment } from "@/lib/riskAssessment";

interface ImprovementPlanPrintProps {
  priorities: ZoneRiskAssessment[];
  totalReports: number;
}

/**
 * 개선계획서 인쇄용 문서.
 *
 * 화면에서는 숨겨져 있다가 인쇄할 때만 나타난다(globals.css의 @media print).
 * 별도 PDF 라이브러리를 쓰지 않고 브라우저 인쇄 기능을 그대로 활용한다.
 * 브라우저의 "대상: PDF로 저장"을 고르면 그대로 PDF가 된다.
 *
 * 화면용 다크 테마와 달리 흰 배경·검정 글자로 만든다. 인쇄물은 종이에
 * 찍히므로 어두운 배경을 그대로 쓰면 토너만 낭비되고 읽기도 어렵다.
 */
export function ImprovementPlanPrint({
  priorities,
  totalReports,
}: ImprovementPlanPrintProps) {
  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const highCount = priorities.filter((p) => p.grade === "높음").length;

  return (
    <div id="improvement-plan-print" className="hidden">
      <header>
        <h1>아차사고 기반 위험성평가 개선계획서</h1>
        <table className="meta">
          <tbody>
            <tr>
              <th>작성일</th>
              <td>{today}</td>
              <th>평가 대상 신고</th>
              <td>{totalReports}건</td>
            </tr>
            <tr>
              <th>평가 구역</th>
              <td>{priorities.length}개소</td>
              <th>즉시 개선 대상</th>
              <td>{highCount}개소</td>
            </tr>
          </tbody>
        </table>
        <p className="note">
          위험성 = 가능성(빈도) × 중대성(강도). 각 1~3점, 최대 9점.
          6점 이상 &lsquo;높음&rsquo;은 즉시 개선, 3~4점 &lsquo;보통&rsquo;은 개선계획 수립,
          1~2점 &lsquo;낮음&rsquo;은 현 수준 유지·관리 대상입니다.
          중대성은 해당 구역에서 관측된 최대 심각도를 적용했습니다.
        </p>
      </header>

      {priorities.map((z, i) => (
        <section key={z.zoneId} className="zone">
          <h2>
            {i + 1}. {z.zoneLabel}
            <span className={`grade grade-${z.grade}`}>
              위험성 {z.riskScore} · {z.grade}
            </span>
          </h2>

          <table className="detail">
            <tbody>
              <tr>
                <th>신고 건수</th>
                <td>{z.reportCount}건</td>
                <th>가능성</th>
                <td>
                  {z.likelihood} ({z.likelihoodLabel})
                </td>
                <th>중대성</th>
                <td>
                  {z.severity} ({z.severityLabel})
                </td>
              </tr>
              <tr>
                <th>주요 배후 요인</th>
                <td colSpan={5}>
                  {z.dominantFactors.length > 0
                    ? z.dominantFactors.map((f) => `${f.factor} (${f.count}건)`).join(", ")
                    : "태깅된 배후 요인 없음"}
                </td>
              </tr>
              <tr>
                <th>주 오류 유형</th>
                <td colSpan={5}>{z.dominantErrorType ?? "미분류"}</td>
              </tr>
            </tbody>
          </table>

          {z.measures.length > 0 && (
            <>
              <h3>개선대책 (위험성 감소대책 우선순위 순)</h3>
              <table className="measures">
                <thead>
                  <tr>
                    <th style={{ width: "70px" }}>단계</th>
                    <th>조치 내용</th>
                    <th style={{ width: "80px" }}>담당</th>
                    <th style={{ width: "80px" }}>완료 예정</th>
                  </tr>
                </thead>
                <tbody>
                  {z.measures.map((m, idx) => (
                    <tr key={idx}>
                      <td>{m.level}</td>
                      <td>{m.action}</td>
                      <td></td>
                      <td></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {z.errorTypeAdvice && (
            <p className="advice">
              <strong>검토 의견:</strong> {z.errorTypeAdvice}
            </p>
          )}
        </section>
      ))}

      <footer>
        <p>
          본 계획서는 접수된 아차사고 데이터로부터 자동 산출되었습니다.
          현장 확인을 거쳐 담당자와 완료 예정일을 기입한 뒤 사용하십시오.
        </p>
        <table className="sign">
          <tbody>
            <tr>
              <th>작성자</th>
              <td></td>
              <th>검토자</th>
              <td></td>
              <th>승인자</th>
              <td></td>
            </tr>
          </tbody>
        </table>
      </footer>
    </div>
  );
}
