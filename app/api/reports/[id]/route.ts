import { NextRequest, NextResponse } from "next/server";
import { getReportById, updateReport } from "@/lib/reportRepository";
import { HUMAN_ERROR_TYPES } from "@/lib/types";
import type { ReportStatus, HumanErrorType, ContributingFactor } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VALID_STATUSES: ReportStatus[] = ["미분류", "분석중", "조치완료"];

interface PatchBody {
  status?: ReportStatus;
  humanErrorType?: HumanErrorType;
  contributingFactors?: ContributingFactor[];
  isExemplary?: boolean;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const existing = getReportById(params.id);
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

  const updated = updateReport(params.id, {
    status: body.status,
    humanErrorType: body.humanErrorType,
    contributingFactors: body.contributingFactors,
    isExemplary: body.isExemplary,
  });

  return NextResponse.json({ report: updated });
}
