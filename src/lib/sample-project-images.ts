import { normalizeProjectImages } from "@/lib/project-images";

/** Local Pexels samples — replace with real project photos in admin */
const sampleSets = [
  [
    "/sample-projects/01-residential-home.jpg",
    "/sample-projects/02-interior-living.jpg",
    "/sample-projects/05-kitchen-finish.jpg",
    "/sample-projects/11-renovation-interior.jpg",
  ],
  [
    "/sample-projects/07-townhouse-row.jpg",
    "/sample-projects/10-subdivision-aerial.jpg",
    "/sample-projects/03-construction-site.jpg",
    "/sample-projects/12-workers-site.jpg",
  ],
  [
    "/sample-projects/04-commercial-building.jpg",
    "/sample-projects/08-warehouse-industrial.jpg",
    "/sample-projects/09-clinic-interior.jpg",
    "/sample-projects/06-framing-works.jpg",
  ],
];

export function getDisplayProjectImages(
  projectName: string,
  images: string[] | null | undefined
): string[] {
  const realImages = normalizeProjectImages(images);
  if (realImages.length > 0) return realImages;

  const index =
    Array.from(projectName).reduce((sum, char) => sum + char.charCodeAt(0), 0) %
    sampleSets.length;

  return sampleSets[index];
}
