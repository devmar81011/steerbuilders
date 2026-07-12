"use client";

import { useEffect, useState } from "react";
import {
  FeaturedProjectsGallery,
  type FeaturedProject,
} from "@/components/sections/featured-projects-gallery";
import {
  getFeaturedLimitPreview,
  mergeProjectsWithPreview,
  selectFeaturedProjects,
} from "@/lib/projects-preview-storage";
import type { ProjectRow } from "@/lib/supabase/types";

type Props = {
  projects: ProjectRow[];
  displayImagesById: Record<string, string[]>;
  featuredLimit: number;
};

function mapFeaturedProjects(
  projects: ProjectRow[],
  displayImagesById: Record<string, string[]>,
  limit: number
): FeaturedProject[] {
  return selectFeaturedProjects(projects, limit).map((project) => ({
    id: project.id,
    name: project.name,
    scope: project.scope,
    location: project.location,
    status: project.status,
    description: project.description,
    images: displayImagesById[project.id] ?? [],
  }));
}

export function FeaturedProjectsSectionClient({
  projects,
  displayImagesById,
  featuredLimit,
}: Props) {
  const [featuredProjects, setFeaturedProjects] = useState<FeaturedProject[]>(() =>
    mapFeaturedProjects(projects, displayImagesById, featuredLimit)
  );

  useEffect(() => {
    const limit = getFeaturedLimitPreview() || featuredLimit;
    const merged = mergeProjectsWithPreview(projects);
    setFeaturedProjects(mapFeaturedProjects(merged, displayImagesById, limit));
  }, [projects, displayImagesById, featuredLimit]);

  if (featuredProjects.length === 0) return null;

  return <FeaturedProjectsGallery projects={featuredProjects} />;
}
