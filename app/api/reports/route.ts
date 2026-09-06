import { NextRequest, NextResponse } from "next/server";
import { createReport, getAllReports, getReportsByEmployee } from "@/lib/reportRepository";
import { FACTORY_ZONES } from "@/lib/constants";

// 매 요청마다 DB를 직접 조회해야 하므로 정적 캐시를 사용하지 않는다.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** 전체 조회, 또는 ?employeeId=... 로 특정 작업자의 신고 이력만 조회 */
export async function GET(request: NextRequest) {
  const employeeId = request.nextUrl.searchParams.get("employeeId");
  const reports = employeeId
    ? getReportsByEmployee(employeeId.trim())
    : getAllReports();
  return NextResponse.json({ reports });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 본문입니다." }, { status: 400 });
  }

  const { zoneId, transcript, photoAttached, employeeId, isAnonymous } = (body ?? {}) as {
    zoneId?: string;
    transcript?: string;
    photoAttached?: boolean;
    employeeId?: string;
    isAnonymous?: boolean;
  };

  if (!zoneId || !FACTORY_ZONES.some((z) => z.id === zoneId)) {
    return NextResponse.json({ error: "유효한 zoneId가 필요합니다." }, { status: 400 });
  }
  if (!transcript || !transcript.trim()) {
    return NextResponse.json({ error: "transcript(신고 내용)가 필요합니다." }, { status: 400 });
  }

  const report = createReport({
    zoneId,
    transcript: transcript.trim(),
    photoAttached: Boolean(photoAttached),
    employeeId: employeeId?.trim() || undefined,
    isAnonymous: Boolean(isAnonymous),
  });

  return NextResponse.json({ report }, { status: 201 });
}
