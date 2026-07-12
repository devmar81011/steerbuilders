import type { ProjectRow } from "@/lib/supabase/types";

export const STANDARD_PROJECT_STATUSES = ["Completed", "Ongoing"] as const;
export type StandardProjectStatus = (typeof STANDARD_PROJECT_STATUSES)[number];
export type ProjectStatusPreset = StandardProjectStatus | "other";

export function isStandardProjectStatus(status: string): status is StandardProjectStatus {
  const value = status.trim().toLowerCase();
  return value === "completed" || value === "ongoing";
}

export function getProjectStatusPreset(status: string): ProjectStatusPreset {
  const value = status.trim().toLowerCase();
  if (value === "completed") return "Completed";
  if (value === "ongoing") return "Ongoing";
  return "other";
}

export function resolveProjectStatus(
  preset: ProjectStatusPreset,
  other: string
): string {
  if (preset === "other") return other.trim();
  return preset;
}

export function parseProjectStatusForForm(status: string) {
  const preset = getProjectStatusPreset(status);
  return {
    statusPreset: preset,
    statusOther: preset === "other" ? status : "",
  };
}

export function getProjectCategory(
  status: string,
  category?: ProjectRow["category"] | null
): "completed" | "ongoing" {
  if (category === "completed" || category === "ongoing") return category;
  return status.trim().toLowerCase() === "completed" ? "completed" : "ongoing";
}

export function isCompletedProject(project: {
  status: string;
  category?: ProjectRow["category"] | null;
}) {
  return getProjectCategory(project.status, project.category) === "completed";
}

export function isOngoingProject(project: {
  status: string;
  category?: ProjectRow["category"] | null;
}) {
  return !isCompletedProject(project);
}

export function getStatusLabelClass(
  status: string,
  category?: ProjectRow["category"] | null
): string {
  if (isCompletedProject({ status, category })) {
    return "text-sbc-gold font-semibold";
  }
  if (status.trim().toLowerCase() === "ongoing") {
    return "text-sbc-gold-dark font-semibold";
  }
  return "text-sbc-gray font-medium";
}
