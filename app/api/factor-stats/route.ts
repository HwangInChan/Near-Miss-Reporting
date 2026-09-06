import { NextResponse } from "next/server";
import { getContributingFactorStats } from "@/lib/reportRepository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** 배후 요인별 발생 건수 (많은 순) */
export async function GET() {
  return NextResponse.json({ stats: await getContributingFactorStats() });
}
