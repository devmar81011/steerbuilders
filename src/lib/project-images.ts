/** How many photos to show on homepage cards before opening the project modal */
export const HOMEPAGE_PREVIEW_IMAGE_COUNT = 4;

export function normalizeProjectImages(
  raw: string[] | null | undefined
): string[] {
  return (raw ?? []).map((url) => url.trim()).filter(Boolean);
}

export function getProjectPreviewImages(
  images: string[] | null | undefined,
  limit = HOMEPAGE_PREVIEW_IMAGE_COUNT
): string[] {
  return normalizeProjectImages(images).slice(0, limit);
}

export function parseProjectImageFields(fields: string[]): string[] {
  return normalizeProjectImages(fields);
}
