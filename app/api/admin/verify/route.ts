import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * 관리자 암호 확인.
 *
 * 암호는 환경변수 ADMIN_PASSWORD에 두고 서버에서만 비교한다. 클라이언트 코드에
 * 암호를 넣으면 브라우저 개발자 도구로 그대로 읽히므로 반드시 서버에서 확인한다.
 * (NEXT_PUBLIC_ 접두사를 쓰면 안 되는 이유이기도 하다.)
 *
 * 주의 - 이것은 "시연용 접근 제어"이지 실제 인증이 아니다. 자세한 한계는
 * README의 "관리자 접근 제어" 섹션 참고.
 */
const DEFAULT_PASSWORD = "5432";

export async function POST(request: NextRequest) {
  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청입니다." }, { status: 400 });
  }

  const expected = process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD;
  const given = (body.password ?? "").trim();

  if (!given) {
    return NextResponse.json({ ok: false, error: "암호를 입력해주세요." }, { status: 400 });
  }

  if (given !== expected) {
    return NextResponse.json(
      { ok: false, error: "암호가 올바르지 않습니다." },
      { status: 401 }
    );
  }

  return NextResponse.json({ ok: true });
}
