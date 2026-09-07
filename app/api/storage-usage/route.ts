import { NextResponse } from "next/server";
import { getPhotoStorageUsage } from "@/lib/reportRepository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** 첨부 사진이 차지하는 저장 용량 (건수, 총 바이트) */
export async function GET() {
  return NextResponse.json({ usage: await getPhotoStorageUsage() });
}
