import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  getAdminHost,
  getSupabaseEnv,
  shouldRedirectToConfiguredAdminHost,
} from "@/lib/supabase/config";

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host");

  if (shouldRedirectToConfiguredAdminHost(host)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.protocol = "https";
    redirectUrl.host = getAdminHost();
    return NextResponse.redirect(redirectUrl);
  }

  const env = getSupabaseEnv();
  const isLoginPage = request.nextUrl.pathname === "/admin/login";

  if (!env) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAdmin = user?.app_metadata.role === "admin";

  if (!isAdmin && !isLoginPage) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  if (isAdmin && isLoginPage) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
