export const MAX_PROJECT_IMAGES = 4;

export function normalizeProjectImages(
  raw: string[] | null | undefined
): string[] {
  return (raw ?? [])
    .map((url) => url.trim())
    .filter(Boolean)
    .slice(0, MAX_PROJECT_IMAGES);
}

export function parseProjectImageFields(fields: string[]): string[] {
  return normalizeProjectImages(fields);
}
