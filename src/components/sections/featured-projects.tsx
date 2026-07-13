import { getFeaturedProjectLimit } from "@/lib/actions/site-settings";
import { getProjectsOrFallback } from "@/lib/actions/projects";
import { getDisplayProjectImages } from "@/lib/sample-project-images";
import { selectFeaturedProjects } from "@/lib/projects-preview-storage";
import { FeaturedProjectsGallery } from "@/components/sections/featured-projects-gallery";

export async function FeaturedProjectsSection() {
  const [portfolio, featuredLimit] = await Promise.all([
    getProjectsOrFallback(),
    getFeaturedProjectLimit(),
  ]);

  const featuredProjects = selectFeaturedProjects(portfolio, featuredLimit).map(
    (project) => ({
      id: project.id,
      name: project.name,
      scope: project.scope,
      location: project.location,
      status: project.status,
      description: project.description,
      images: getDisplayProjectImages(project.name, project.images),
    })
  );

  if (featuredProjects.length === 0) return null;

  return <FeaturedProjectsGallery projects={featuredProjects} />;
}
