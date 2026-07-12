"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ProjectInput, ProjectRow } from "@/lib/supabase/types";
import { portfolio } from "@/lib/company-content";
import { normalizeProjectImages } from "@/lib/project-images";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getFeaturedProjectLimit } from "@/lib/actions/site-settings";
import { requireAdmin } from "@/lib/auth/require-admin";

export async function ensureProjectsSeeded() {
  if (!isSupabaseConfigured()) return { seeded: false as const };

  const existing = await getProjects();
  if (existing.length > 0) return { seeded: false as const };

  return seedProjectsFromContent();
}

export async function getProjects(): Promise<ProjectRow[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error || !data?.length) return [];
    return (data as ProjectRow[]).map((row) => ({
      ...row,
      images: normalizeProjectImages(row.images),
    }));
  } catch {
    return [];
  }
}

export async function getProjectsOrFallback(): Promise<ProjectRow[]> {
  const rows = await getProjects();
  if (rows.length > 0) return rows;

  return portfolio.map((p, index) => ({
    id: `static-${index}`,
    name: p.name,
    scope: p.scope,
    location: p.location,
    status: p.status,
    completion: p.completion,
    description: p.description ?? null,
    featured: p.featured ?? false,
    category: p.category ?? null,
    images: normalizeProjectImages(p.images),
    sort_order: index,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
}

async function countFeaturedProjects(excludeId?: string): Promise<number> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("featured", true);

    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { count, error } = await query;
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

async function assertFeaturedLimit(
  featured: boolean | undefined,
  projectId?: string
): Promise<{ error?: string }> {
  if (featured !== true) return {};

  const limit = await getFeaturedProjectLimit();
  const featuredCount = await countFeaturedProjects(projectId);
  if (featuredCount >= limit) {
    return {
      error: `Featured limit reached (${limit}). Unfeature another project first or increase the limit in project settings.`,
    };
  }

  return {};
}

export async function createProject(input: ProjectInput) {
  await requireAdmin();
  const limitCheck = await assertFeaturedLimit(input.featured);
  if (limitCheck.error) return { error: limitCheck.error };

  const supabase = await createClient();
  const payload = {
    ...input,
    images: normalizeProjectImages(input.images),
  };
  const { error } = await supabase.from("projects").insert(payload);
  if (error) return { error: error.message };
  revalidatePath("/projects");
  revalidatePath("/admin/projects");
  revalidatePath("/");
  return { success: true };
}

export async function updateProject(id: string, input: Partial<ProjectInput>) {
  await requireAdmin();
  const limitCheck = await assertFeaturedLimit(input.featured, id);
  if (limitCheck.error) return { error: limitCheck.error };

  const supabase = await createClient();
  const payload = {
    ...input,
    ...(input.images !== undefined
      ? { images: normalizeProjectImages(input.images) }
      : {}),
  };
  const { error } = await supabase.from("projects").update(payload).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/projects");
  revalidatePath("/admin/projects");
  revalidatePath("/");
  return { success: true };
}

export async function deleteProject(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/projects");
  revalidatePath("/admin/projects");
  revalidatePath("/");
  return { success: true };
}

export async function seedProjectsFromContent() {
  await requireAdmin();
  const existing = await getProjects();
  if (existing.length > 0) {
    return { error: "Projects table already has data. Clear it first or add manually." };
  }

  const supabase = await createClient();
  const rows = portfolio.map((p, index) => ({
    name: p.name,
    scope: p.scope,
    location: p.location,
    status: p.status,
    completion: p.completion,
    description: p.description ?? null,
    featured: p.featured ?? false,
    category: p.category ?? null,
    images: normalizeProjectImages(p.images),
    sort_order: index,
  }));

  const { error } = await supabase.from("projects").insert(rows);
  if (error) return { error: error.message };
  revalidatePath("/projects");
  revalidatePath("/admin/projects");
  revalidatePath("/");
  return { success: true, count: rows.length };
}
