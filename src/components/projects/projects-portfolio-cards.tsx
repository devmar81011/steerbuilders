import Image from "next/image";
import { getStatusLabelClass } from "@/lib/project-status";
import { normalizeProjectImages } from "@/lib/project-images";
import type { ProjectRow } from "@/lib/supabase/types";

type Props = {
  projects: ProjectRow[];
  filterLabel: string;
};

function ProjectCard({ project }: { project: ProjectRow }) {
  const images = normalizeProjectImages(project.images);
  const cover = images[0];
  const extraCount = Math.max(0, images.length - 1);

  return (
    <article className="group flex h-full flex-col overflow-hidden border border-sbc-gray-light bg-sbc-white transition-shadow hover:shadow-lg">
      <div className="relative aspect-[4/3] overflow-hidden bg-sbc-black">
        {cover ? (
          <Image
            src={cover}
            alt={project.name}
            fill
            unoptimized
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <>
            <div className="absolute inset-0 bg-linear-to-br from-sbc-black via-[#1a1a1a] to-sbc-gold/30" />
            <div className="absolute inset-0 flex items-end p-4">
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-sbc-gold">
                Photo coming soon
              </p>
            </div>
          </>
        )}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-linear-to-r from-sbc-gold via-[#d4a647] to-sbc-gold-dark" />
        <div className="absolute left-3 top-3">
          <span
            className={`bg-sbc-black/75 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest backdrop-blur-sm ${getStatusLabelClass(project.status, project.category)}`}
          >
            {project.status}
          </span>
        </div>
        {extraCount > 0 && (
          <div className="absolute bottom-3 right-3 bg-sbc-black/75 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-white">
            +{extraCount} more
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="text-lg font-bold text-sbc-black">{project.name}</h3>
        <p className="text-sm font-semibold text-sbc-gray">{project.scope}</p>
        <p className="mt-auto text-xs font-medium uppercase tracking-widest text-sbc-gray">
          {project.location}
        </p>
        {project.description ? (
          <p className="line-clamp-3 text-sm font-medium leading-relaxed text-sbc-gray">
            {project.description}
          </p>
        ) : null}
      </div>
    </article>
  );
}

export function ProjectsPortfolioCards({ projects, filterLabel }: Props) {
  if (projects.length === 0) {
    return (
      <p className="border border-sbc-gray-light bg-sbc-white px-6 py-10 text-center text-sm font-semibold text-sbc-gray">
        No projects match this filter.
      </p>
    );
  }

  return (
    <div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
      <p className="mt-8 text-center text-xs font-medium uppercase tracking-widest text-sbc-gray">
        {projects.length} project{projects.length === 1 ? "" : "s"}
        {filterLabel ? ` · ${filterLabel}` : ""} · Steer Builders Portfolio
      </p>
    </div>
  );
}
