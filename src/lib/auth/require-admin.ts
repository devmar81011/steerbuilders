import "server-only";

import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/supabase/config";

export type AdminContext = {
  user: User;
  supabase: Awaited<ReturnType<typeof createClient>>;
  accessToken: string | null;
};

function getBearerToken(request?: NextRequest) {
  const header = request?.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token || null;
}

async function getAdminContext(request?: NextRequest): Promise<AdminContext | null> {
  if (!isSupabaseConfigured()) return null;

  const bearer = getBearerToken(request);
  const env = getSupabaseEnv();

  if (bearer && env) {
    const supabase = createSupabaseClient(env.url, env.key, {
      global: { headers: { Authorization: `Bearer ${bearer}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.app_metadata.role !== "admin") {
      return null;
    }

    return { user, supabase, accessToken: bearer };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.app_metadata.role !== "admin") {
    return null;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return {
    user,
    supabase,
    accessToken: session?.access_token ?? null,
  };
}

export async function requireAdmin() {
  const admin = await getAdminContext();
  if (!admin) {
    redirect("/admin/login");
  }

  return admin.user;
}

/** Server actions: prefer Bearer token from the browser when cookies are unavailable. */
export async function requireAdminForAction(accessToken?: string | null) {
  const admin = await getAdminContextForAction(accessToken);
  if (!admin) {
    redirect("/admin/login");
  }

  return admin;
}

async function getAdminContextForAction(
  accessToken?: string | null
): Promise<AdminContext | null> {
  if (accessToken) {
    const env = getSupabaseEnv();
    if (!env) return null;

    const supabase = createSupabaseClient(env.url, env.key, {
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.app_metadata.role !== "admin") {
      return null;
    }

    return { user, supabase, accessToken };
  }

  return getAdminContext();
}

export async function requireAdminApi(request?: NextRequest) {
  return getAdminContext(request);
}
