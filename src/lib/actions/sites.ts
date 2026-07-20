"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/auth/require-admin";

export type Site = {
  id: string;
  name: string;
  status: "active" | "inactive";
};

const mockSites: Site[] = [
  { id: "site-001", name: "Main Site", status: "active" },
  { id: "site-002", name: "Head Office", status: "active" },
];

function mapSite(row: Record<string, unknown>): Site {
  return {
    id: row.id as string,
    name: row.name as string,
    status: (row.status as "active" | "inactive") ?? "active",
  };
}

export async function getSites(): Promise<Site[]> {
  if (!isSupabaseConfigured()) {
    return mockSites;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sites")
      .select("*")
      .order("name");

    if (error) return mockSites;
    return (data as Record<string, unknown>[]).map(mapSite);
  } catch {
    return mockSites;
  }
}

export async function createSite(input: { name: string }) {
  await requireAdmin();
  if (!isSupabaseConfigured()) {
    return { success: true };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("sites")
      .insert({
        name: input.name.trim(),
        status: "active",
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        return { error: "A site with this name already exists." };
      }
      return { error: error.message };
    }
    if (!data?.id) return { error: "Site was not created." };

    revalidatePath("/admin/sites");
    revalidatePath("/admin/employees");
    return { success: true, id: data.id as string };
  } catch {
    return { error: "Could not create site." };
  }
}

export async function updateSite(
  id: string,
  input: {
    name: string;
    status: "active" | "inactive";
  }
) {
  await requireAdmin();
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("sites")
      .update({
        name: input.name.trim(),
        status: input.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      if (error.code === "23505") {
        return { error: "A site with this name already exists." };
      }
      return { error: error.message };
    }
  } catch {
    return { error: "Could not update site." };
  }

  revalidatePath("/admin/sites");
  revalidatePath("/admin/employees");
  return { success: true };
}

export async function deleteSite(id: string) {
  await requireAdmin();
  if (!isSupabaseConfigured()) {
    return { success: true };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("sites").delete().eq("id", id);
    if (error) {
      return { error: error.message };
    }
  } catch {
    return { error: "Could not delete site." };
  }

  revalidatePath("/admin/sites");
  revalidatePath("/admin/employees");
  return { success: true };
}
