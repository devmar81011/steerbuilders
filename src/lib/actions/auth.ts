"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { applySessionPersistence } from "@/lib/auth/session-cookies";
import { requireAdmin } from "@/lib/auth/require-admin";

export type LoginState = {
  error?: string;
};

export type ChangePasswordState = {
  error?: string;
  success?: string;
};

export async function login(
  _previousState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const rememberMe = formData.get("rememberMe") === "on";

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  if (!isSupabaseConfigured()) {
    return {
      error:
        "Supabase is not configured on this server. Add the Supabase env vars in Vercel and redeploy.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "Invalid email or password." };
  }

  if (data.user.app_metadata.role !== "admin") {
    await supabase.auth.signOut();
    return { error: "This account does not have administrator access." };
  }

  await applySessionPersistence(rememberMe);
  redirect("/admin");
}

export async function logout() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/admin/login");
}

export async function changePassword(
  _previousState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  await requireAdmin();

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "Fill in all password fields." };
  }

  if (newPassword.length < 8) {
    return { error: "New password must be at least 8 characters." };
  }

  if (newPassword !== confirmPassword) {
    return { error: "New passwords do not match." };
  }

  if (newPassword === currentPassword) {
    return { error: "Choose a different password from your current one." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { error: "Unable to verify your account." };
  }

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (verifyError) {
    return { error: "Current password is incorrect." };
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    return { error: error.message };
  }

  return { success: "Password updated successfully." };
}
