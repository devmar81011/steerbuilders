import { getProjectsOrFallback } from "@/lib/actions/projects";
import { getDisplayProjectImages } from "@/lib/sample-project-images";
import { FeaturedProjectsGallery } from "@/components/sections/featured-projects-gallery";

export async function FeaturedProjectsSection() {
  const portfolio = await getProjectsOrFallback();
  const featured = portfolio
    .filter((p) => p.featured)
    .map((project) => ({
      id: project.id,
      name: project.name,
      scope: project.scope,
      location: project.location,
      status: project.status,
      completion: project.completion,
      description: project.description,
      images: getDisplayProjectImages(project.name, project.images),
    }));

  return <FeaturedProjectsGallery projects={featured} />;
}
