import { NextResponse } from "next/server";
import {
  E2E_ADMIN_BYPASS_COOKIE,
  getE2eAdminBypassSecret,
  isE2eAdminBypassEnabled,
} from "@/lib/auth/e2e-bypass";

/**
 * Local/Playwright-only session bootstrap. Returns 404 unless
 * E2E_ADMIN_BYPASS_SECRET is set and VERCEL_ENV is not production.
 */
export async function POST(request: Request) {
  if (!isE2eAdminBypassEnabled()) {
    return new NextResponse(null, { status: 404 });
  }

  const secret = getE2eAdminBypassSecret();
  if (!secret) {
    return new NextResponse(null, { status: 404 });
  }

  let provided = "";
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => null)) as {
      secret?: string;
    } | null;
    provided = body?.secret?.trim() ?? "";
  } else {
    const form = await request.formData().catch(() => null);
    provided = String(form?.get("secret") ?? "").trim();
  }

  if (provided !== secret) {
    return NextResponse.json({ error: "Invalid secret." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(E2E_ADMIN_BYPASS_COOKIE, secret, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    secure: false,
    maxAge: 60 * 60 * 8,
  });
  return response;
}

export async function DELETE() {
  if (!isE2eAdminBypassEnabled()) {
    return new NextResponse(null, { status: 404 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(E2E_ADMIN_BYPASS_COOKIE, "", {
    path: "/",
    maxAge: 0,
  });
  return response;
}
