import { NextRequest, NextResponse } from "next/server";
import { createReport, getAllReports, getReportsByEmployee, savePhoto, MAX_PHOTO_BYTES } from "@/lib/reportRepository";
import { FACTORY_ZONES } from "@/lib/constants";

// 매 요청마다 DB를 직접 조회해야 하므로 정적 캐시를 사용하지 않는다.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** 전체 조회, 또는 ?employeeId=... 로 특정 작업자의 신고 이력만 조회 */
export async function GET(request: NextRequest) {
  const employeeId = request.nextUrl.searchParams.get("employeeId");
  const reports = employeeId
    ? await getReportsByEmployee(employeeId.trim())
    : await getAllReports();
  return NextResponse.json({ reports });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 본문입니다." }, { status: 400 });
  }

  const { zoneId, transcript, photoDataUrl, employeeId, isAnonymous } = (body ?? {}) as {
    zoneId?: string;
    transcript?: string;
    /** "data:image/jpeg;base64,..." 형태. 클라이언트에서 리사이즈·압축해 보낸다. */
    photoDataUrl?: string;
    employeeId?: string;
    isAnonymous?: boolean;
  };

  if (!zoneId || !FACTORY_ZONES.some((z) => z.id === zoneId)) {
    return NextResponse.json({ error: "유효한 zoneId가 필요합니다." }, { status: 400 });
  }
  if (!transcript || !transcript.trim()) {
    return NextResponse.json({ error: "transcript(신고 내용)가 필요합니다." }, { status: 400 });
  }

  // 사진이 있으면 먼저 파싱·검증한 뒤 리포트를 만든다.
  // (리포트만 만들어지고 사진 저장에서 실패하는 상태를 피하기 위함)
  let photo: { mimeType: string; buffer: Buffer } | null = null;
  if (photoDataUrl) {
    const match = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(photoDataUrl);
    if (!match) {
      return NextResponse.json(
        { error: "지원하지 않는 이미지 형식입니다. (jpeg/png/webp)" },
        { status: 400 }
      );
    }
    const buffer = Buffer.from(match[2], "base64");
    if (buffer.byteLength > MAX_PHOTO_BYTES) {
      return NextResponse.json(
        { error: "사진 용량이 너무 큽니다. 다시 촬영해주세요." },
        { status: 413 }
      );
    }
    photo = { mimeType: match[1], buffer };
  }

  const report = await createReport({
    zoneId,
    transcript: transcript.trim(),
    photoAttached: photo !== null,
    employeeId: employeeId?.trim() || undefined,
    isAnonymous: Boolean(isAnonymous),
  });

  if (photo) {
    await savePhoto(report.id, photo.mimeType, photo.buffer);
  }

  return NextResponse.json({ report }, { status: 201 });
}
