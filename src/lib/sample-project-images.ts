import { normalizeProjectImages } from "@/lib/project-images";

/**
 * Prefer real uploaded project photos only.
 * Empty galleries stay empty so the UI can show a branded placeholder.
 */
export function getDisplayProjectImages(
  _projectName: string,
  images: string[] | null | undefined
): string[] {
  return normalizeProjectImages(images);
}
