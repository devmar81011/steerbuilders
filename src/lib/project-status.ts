import type { ProjectRow } from "@/lib/supabase/types";

export const STATUS_SUGGESTIONS = ["Completed", "Ongoing", "On hold"] as const;

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

export function getStatusBadgeVariant(
  status: string,
  category?: ProjectRow["category"] | null
): "gold" | "dark" | "light" {
  if (isCompletedProject({ status, category })) return "gold";
  if (status.trim().toLowerCase() === "ongoing") return "dark";
  return "light";
}
