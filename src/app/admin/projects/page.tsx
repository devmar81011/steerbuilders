import { AdminProjectsClient } from "@/components/admin/projects-client";
import { getProjects, getProjectsOrFallback } from "@/lib/actions/projects";

export default async function AdminProjectsPage() {
  const dbProjects = await getProjects();
  const projects = dbProjects.length > 0 ? dbProjects : await getProjectsOrFallback();

  return (
    <AdminProjectsClient projects={projects} usingDatabase={dbProjects.length > 0} />
  );
}
