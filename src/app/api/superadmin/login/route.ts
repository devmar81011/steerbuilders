import { NextResponse } from "next/server";
import {
  checkSuperadminPassword,
  createSuperadminToken,
  SUPERADMIN_COOKIE,
  superadminCookieOptions,
} from "@/lib/superadmin-auth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    password?: string;
  } | null;

  const password = body?.password?.trim() ?? "";
  if (!(await checkSuperadminPassword(password))) {
    return NextResponse.json({ error: "Invalid password." }, { status: 401 });
  }

  const token = await createSuperadminToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SUPERADMIN_COOKIE, token, superadminCookieOptions);
  return response;
}
