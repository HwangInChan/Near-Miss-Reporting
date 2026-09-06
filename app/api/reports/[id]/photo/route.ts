import { NextResponse } from "next/server";
import { getPhoto } from "@/lib/reportRepository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** 첨부 사진 원본을 이미지로 그대로 응답한다. <img src="/api/reports/{id}/photo"> 로 사용. */
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const photo = await getPhoto(params.id);
  if (!photo) {
    return NextResponse.json({ error: "사진이 없습니다." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(photo.data), {
    headers: {
      "Content-Type": photo.mimeType,
      "Content-Length": String(photo.data.byteLength),
      // 사진은 한 번 저장되면 바뀌지 않으므로 브라우저 캐시를 허용한다.
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
