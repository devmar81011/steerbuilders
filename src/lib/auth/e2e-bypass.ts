import "server-only";

import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";

export const E2E_ADMIN_BYPASS_COOKIE = "sbc-e2e-admin-bypass";

/** Never enable bypass on Vercel production, even if a secret is mis-set. */
export function isE2eAdminBypassEnabled(): boolean {
  if (process.env.VERCEL_ENV === "production") return false;
  const secret = process.env.E2E_ADMIN_BYPASS_SECRET?.trim();
  return Boolean(secret);
}

export function getE2eAdminBypassSecret(): string | null {
  if (!isE2eAdminBypassEnabled()) return null;
  return process.env.E2E_ADMIN_BYPASS_SECRET!.trim();
}

export function hasValidE2eAdminBypass(
  cookieValue: string | undefined | null
): boolean {
  const secret = getE2eAdminBypassSecret();
  if (!secret || !cookieValue) return false;
  return cookieValue === secret;
}

export function requestHasE2eAdminBypass(request: NextRequest): boolean {
  return hasValidE2eAdminBypass(
    request.cookies.get(E2E_ADMIN_BYPASS_COOKIE)?.value
  );
}

export async function cookiesHaveE2eAdminBypass(): Promise<boolean> {
  const secret = getE2eAdminBypassSecret();
  if (!secret) return false;
  const store = await cookies();
  return hasValidE2eAdminBypass(store.get(E2E_ADMIN_BYPASS_COOKIE)?.value);
}

/** Synthetic admin user for local Playwright UI flows only. */
export function e2eBypassAdminUser(): User {
  const email =
    process.env.TEST_ADMIN_EMAIL?.trim() ||
    "info@steerbuilderscorporation.com";

  return {
    id: "00000000-0000-4000-8000-0000000000e2",
    app_metadata: { provider: "e2e", providers: ["e2e"], role: "admin" },
    user_metadata: { e2e_bypass: true },
    aud: "authenticated",
    created_at: "2020-01-01T00:00:00.000Z",
    email,
    role: "authenticated",
    updated_at: "2020-01-01T00:00:00.000Z",
  } as User;
}
