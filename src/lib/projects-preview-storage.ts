import type { ProjectRow } from "@/lib/supabase/types";
import {
  clampFeaturedProjectLimit,
  DEFAULT_FEATURED_PROJECT_LIMIT,
} from "@/lib/featured-projects-config";

const STORAGE_KEY = "sbc-projects-preview";

type ProjectsPreviewStore = {
  featured: Record<string, boolean>;
  featuredLimit?: number;
};

function readStore(): ProjectsPreviewStore {
  if (typeof window === "undefined") {
    return { featured: {} };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { featured: {} };
    const parsed = JSON.parse(raw) as Partial<ProjectsPreviewStore>;
    return {
      featured: parsed.featured ?? {},
      featuredLimit: parsed.featuredLimit,
    };
  } catch {
    return { featured: {} };
  }
}

function writeStore(store: ProjectsPreviewStore) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function saveProjectFeaturedPreview(id: string, featured: boolean) {
  const store = readStore();
  store.featured[id] = featured;
  writeStore(store);
}

export function saveFeaturedLimitPreview(limit: number) {
  const store = readStore();
  store.featuredLimit = clampFeaturedProjectLimit(limit);
  writeStore(store);
}

export function getFeaturedLimitPreview(): number {
  const store = readStore();
  if (store.featuredLimit === undefined) return DEFAULT_FEATURED_PROJECT_LIMIT;
  return clampFeaturedProjectLimit(store.featuredLimit);
}

export function mergeProjectsWithPreview(projects: ProjectRow[]): ProjectRow[] {
  const store = readStore();
  return projects.map((project) => {
    const featuredOverride = store.featured[project.id];
    if (featuredOverride === undefined) return project;
    return { ...project, featured: featuredOverride };
  });
}

export function selectFeaturedProjects<T extends { featured: boolean; sort_order?: number; name: string }>(
  projects: T[],
  limit: number
): T[] {
  return projects
    .filter((project) => project.featured)
    .sort((a, b) => {
      const orderDiff = (a.sort_order ?? 0) - (b.sort_order ?? 0);
      if (orderDiff !== 0) return orderDiff;
      return a.name.localeCompare(b.name);
    })
    .slice(0, clampFeaturedProjectLimit(limit));
}
