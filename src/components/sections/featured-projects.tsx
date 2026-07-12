import { getFeaturedProjectLimit } from "@/lib/actions/site-settings";
import { getProjectsOrFallback } from "@/lib/actions/projects";
import { getDisplayProjectImages } from "@/lib/sample-project-images";
import { FeaturedProjectsSectionClient } from "@/components/sections/featured-projects-section-client";

export async function FeaturedProjectsSection() {
  const [portfolio, featuredLimit] = await Promise.all([
    getProjectsOrFallback(),
    getFeaturedProjectLimit(),
  ]);

  const displayImagesById = Object.fromEntries(
    portfolio.map((project) => [
      project.id,
      getDisplayProjectImages(project.name, project.images),
    ])
  );

  return (
    <FeaturedProjectsSectionClient
      projects={portfolio}
      displayImagesById={displayImagesById}
      featuredLimit={featuredLimit}
    />
  );
}
