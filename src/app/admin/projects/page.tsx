import { AdminProjectsClient } from "@/components/admin/projects-client";
import {
  ensureProjectsSeeded,
  getProjects,
  getProjectsOrFallback,
} from "@/lib/actions/projects";
import { getFeaturedProjectLimit } from "@/lib/actions/site-settings";

export default async function AdminProjectsPage() {
  await ensureProjectsSeeded();

  const [dbProjects, featuredLimit] = await Promise.all([
    getProjects(),
    getFeaturedProjectLimit(),
  ]);
  const projects = dbProjects.length > 0 ? dbProjects : await getProjectsOrFallback();

  return (
    <AdminProjectsClient
      projects={projects}
      usingDatabase={dbProjects.length > 0}
      featuredLimit={featuredLimit}
    />
  );
}
