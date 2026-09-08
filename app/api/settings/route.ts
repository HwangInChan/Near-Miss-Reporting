import { NextRequest, NextResponse } from "next/server";
import { getAssessmentSettings, saveAssessmentSettings } from "@/lib/reportRepository";
import {
  AssessmentSettings,
  DEFAULT_ASSESSMENT_SETTINGS,
  validateSettings,
} from "@/lib/assessmentSettings";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** 현재 사업장 평가 기준값 조회 */
export async function GET() {
  return NextResponse.json({ settings: await getAssessmentSettings() });
}

/** 평가 기준값 저장 */
export async function PUT(request: NextRequest) {
  let body: Partial<AssessmentSettings>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 본문입니다." }, { status: 400 });
  }

  // 일부만 보내도 되도록 기존 값 위에 덮어쓴다.
  const current = await getAssessmentSettings();
  const merged: AssessmentSettings = {
    alertThreshold: Number(body.alertThreshold ?? current.alertThreshold),
    minForFrequent: Number(body.minForFrequent ?? current.minForFrequent),
    minForOccasional: Number(body.minForOccasional ?? current.minForOccasional),
  };

  const error = validateSettings(merged);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  return NextResponse.json({ settings: await saveAssessmentSettings(merged) });
}

/** 기본값으로 되돌리기 */
export async function DELETE() {
  return NextResponse.json({
    settings: await saveAssessmentSettings(DEFAULT_ASSESSMENT_SETTINGS),
  });
}
