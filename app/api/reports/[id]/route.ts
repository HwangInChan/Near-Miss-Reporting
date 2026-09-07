import { NextRequest, NextResponse } from "next/server";
import { getReportById, updateReport } from "@/lib/reportRepository";
import { HUMAN_ERROR_TYPES } from "@/lib/types";
import type { ReportStatus, HumanErrorType, ContributingFactor, Severity } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VALID_STATUSES: ReportStatus[] = ["미분류", "분석중", "조치완료"];
const VALID_SEVERITIES: Severity[] = ["low", "medium", "high"];

interface PatchBody {
  status?: ReportStatus;
  humanErrorType?: HumanErrorType;
  contributingFactors?: ContributingFactor[];
  isExemplary?: boolean;
  severity?: Severity;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const existing = await getReportById(params.id);
  if (!existing) {
    return NextResponse.json({ error: "리포트를 찾을 수 없습니다." }, { status: 404 });
  }

  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "잘못된 요청 본문입니다." }, { status: 400 });
  }

  if (body.status !== undefined && !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "유효하지 않은 status 값입니다." }, { status: 400 });
  }
  if (
    body.humanErrorType !== undefined &&
    !HUMAN_ERROR_TYPES.includes(body.humanErrorType)
  ) {
    return NextResponse.json({ error: "유효하지 않은 humanErrorType 값입니다." }, { status: 400 });
  }
  if (body.severity !== undefined && !VALID_SEVERITIES.includes(body.severity)) {
    return NextResponse.json({ error: "유효하지 않은 severity 값입니다." }, { status: 400 });
  }
  // 배후 요인은 기본 목록 외 자유 입력을 허용하므로 값 자체는 검사하지 않는다.
  // 대신 개수와 길이 상한을 두어 비정상적으로 큰 데이터가 저장되는 것을 막는다.
  if (body.contributingFactors !== undefined) {
    const factors = body.contributingFactors;
    if (!Array.isArray(factors)) {
      return NextResponse.json(
        { error: "contributingFactors는 배열이어야 합니다." },
        { status: 400 }
      );
    }
    if (factors.length > 20) {
      return NextResponse.json(
        { error: "배후 요인은 최대 20개까지 지정할 수 있습니다." },
        { status: 400 }
      );
    }
    if (factors.some((f) => typeof f !== "string" || f.trim().length === 0 || f.length > 30)) {
      return NextResponse.json(
        { error: "배후 요인은 1~30자의 문자열이어야 합니다." },
        { status: 400 }
      );
    }
  }

  const updated = await updateReport(params.id, {
    status: body.status,
    humanErrorType: body.humanErrorType,
    contributingFactors: body.contributingFactors,
    isExemplary: body.isExemplary,
    severity: body.severity,
  });

  return NextResponse.json({ report: updated });
}
