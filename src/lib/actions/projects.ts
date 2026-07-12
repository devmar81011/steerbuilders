"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ProjectInput, ProjectRow } from "@/lib/supabase/types";
import { portfolio } from "@/lib/company-content";
import { normalizeProjectImages } from "@/lib/project-images";

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

export async function createProject(input: ProjectInput) {
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
  const supabase = await createClient();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/projects");
  revalidatePath("/admin/projects");
  revalidatePath("/");
  return { success: true };
}

export async function seedProjectsFromContent() {
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
