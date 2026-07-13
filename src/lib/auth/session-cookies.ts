import { cookies } from "next/headers";

const REMEMBER_ME_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export async function applySessionPersistence(rememberMe: boolean) {
  const cookieStore = await cookies();
  const authCookies = cookieStore
    .getAll()
    .filter((cookie) => cookie.name.startsWith("sb-"));

  for (const cookie of authCookies) {
    cookieStore.set(cookie.name, cookie.value, {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      ...(rememberMe ? { maxAge: REMEMBER_ME_MAX_AGE_SECONDS } : {}),
    });
  }
}
