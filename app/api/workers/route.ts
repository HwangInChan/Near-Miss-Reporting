import { NextRequest, NextResponse } from "next/server";
import { getWorker, registerWorker } from "@/lib/reportRepository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** 사번으로 등록 여부 조회: /api/workers?employeeId=10231 */
export async function GET(request: NextRequest) {
  const employeeId = request.nextUrl.searchParams.get("employeeId");
  if (!employeeId) {
    return NextResponse.json({ error: "employeeId가 필요합니다." }, { status: 400 });
  }
  const worker = await getWorker(employeeId.trim());
  return NextResponse.json({ worker });
}

/** 작업자 등록(또는 이름 갱신) */
export async function POST(request: NextRequest) {
  let body: { employeeId?: string; name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 본문입니다." }, { status: 400 });
  }

  const employeeId = body.employeeId?.trim();
  const name = body.name?.trim();

  if (!employeeId) {
    return NextResponse.json({ error: "사번을 입력해주세요." }, { status: 400 });
  }
  if (!/^[A-Za-z0-9-]{2,20}$/.test(employeeId)) {
    return NextResponse.json(
      { error: "사번은 영문/숫자/하이픈 2~20자로 입력해주세요." },
      { status: 400 }
    );
  }
  if (!name) {
    return NextResponse.json({ error: "이름을 입력해주세요." }, { status: 400 });
  }
  if (name.length > 30) {
    return NextResponse.json({ error: "이름이 너무 깁니다." }, { status: 400 });
  }

  const worker = await registerWorker(employeeId, name);
  return NextResponse.json({ worker }, { status: 201 });
}
