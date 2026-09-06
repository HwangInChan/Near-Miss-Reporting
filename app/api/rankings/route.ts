import { NextResponse } from "next/server";
import { getRewardRankings } from "@/lib/reportRepository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * 포상 집계 순위.
 * 익명 신고는 employee_id가 없어 집계에서 자동으로 제외된다.
 */
export async function GET() {
  return NextResponse.json({ rankings: await getRewardRankings() });
}
