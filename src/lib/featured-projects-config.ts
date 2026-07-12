export const DEFAULT_FEATURED_PROJECT_LIMIT = 4;
export const FEATURED_PROJECT_LIMIT_KEY = "featured_project_limit";
export const MIN_FEATURED_PROJECT_LIMIT = 1;
export const MAX_FEATURED_PROJECT_LIMIT = 12;

export function clampFeaturedProjectLimit(value: number): number {
  return Math.min(
    MAX_FEATURED_PROJECT_LIMIT,
    Math.max(MIN_FEATURED_PROJECT_LIMIT, Math.round(value))
  );
}
