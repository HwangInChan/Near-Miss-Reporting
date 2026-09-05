import { NextRequest, NextResponse } from "next/server";
import { createReport, getAllReports } from "@/lib/reportRepository";
import { FACTORY_ZONES } from "@/lib/constants";

// 매 요청마다 DB를 직접 조회해야 하므로 정적 캐시를 사용하지 않는다.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const reports = getAllReports();
  return NextResponse.json({ reports });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 본문입니다." }, { status: 400 });
  }

  const { zoneId, transcript, photoAttached } = (body ?? {}) as {
    zoneId?: string;
    transcript?: string;
    photoAttached?: boolean;
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
  });

  return NextResponse.json({ report }, { status: 201 });
}
