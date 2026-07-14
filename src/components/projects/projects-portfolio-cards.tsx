"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import {
  IconButton,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
} from "@/components/ui/circle-button";
import { getStatusLabelClass } from "@/lib/project-status";
import { normalizeProjectImages } from "@/lib/project-images";
import type { ProjectRow } from "@/lib/supabase/types";

type Props = {
  projects: ProjectRow[];
  filterLabel: string;
};

export function ProjectsPortfolioCards({ projects, filterLabel }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);

  const activeProject = activeIndex !== null ? projects[activeIndex] : null;
  const photos = activeProject
    ? normalizeProjectImages(activeProject.images)
    : [];

  const close = useCallback(() => {
    setActiveIndex(null);
    setPhotoIndex(0);
  }, []);

  const goNextProject = useCallback(() => {
    if (activeIndex === null || projects.length === 0) return;
    setActiveIndex((activeIndex + 1) % projects.length);
    setPhotoIndex(0);
  }, [activeIndex, projects.length]);

  const goPrevProject = useCallback(() => {
    if (activeIndex === null || projects.length === 0) return;
    setActiveIndex((activeIndex - 1 + projects.length) % projects.length);
    setPhotoIndex(0);
  }, [activeIndex, projects.length]);

  useEffect(() => {
    if (activeIndex === null) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") {
        if (e.shiftKey) goNextProject();
        else setPhotoIndex((i) => (i + 1) % Math.max(photos.length, 1));
      }
      if (e.key === "ArrowLeft") {
        if (e.shiftKey) goPrevProject();
        else
          setPhotoIndex(
            (i) => (i - 1 + Math.max(photos.length, 1)) % Math.max(photos.length, 1)
          );
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeIndex, close, goNextProject, goPrevProject, photos.length]);

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
        {projects.map((project, index) => {
          const images = normalizeProjectImages(project.images);
          const cover = images[0];
          const extraCount = Math.max(0, images.length - 1);

          return (
            <button
              key={project.id}
              type="button"
              className="group flex h-full cursor-pointer flex-col overflow-hidden border border-sbc-gray-light bg-sbc-white text-left transition-shadow hover:border-sbc-gold/50 hover:shadow-lg"
              onClick={() => {
                setActiveIndex(index);
                setPhotoIndex(0);
              }}
            >
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
                <div className="pointer-events-none absolute inset-0 bg-sbc-black/0 transition-colors group-hover:bg-sbc-black/25" />
                <div className="pointer-events-none absolute bottom-4 left-4 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="bg-sbc-black/80 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-white">
                    View photos
                  </span>
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-2 p-5">
                <h3 className="text-lg font-bold text-sbc-black group-hover:text-sbc-gold">
                  {project.name}
                </h3>
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
            </button>
          );
        })}
      </div>

      <p className="mt-8 text-center text-xs font-medium uppercase tracking-widest text-sbc-gray">
        {projects.length} project{projects.length === 1 ? "" : "s"}
        {filterLabel ? ` · ${filterLabel}` : ""} · Steer Builders Portfolio
      </p>

      {activeProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-sbc-black/70 p-4 md:p-8"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label={activeProject.name}
        >
          <div
            className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden bg-sbc-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1 shrink-0 bg-sbc-gold" />

            <div className="absolute right-3 top-3 z-20">
              <IconButton label="Close" variant="gallery" size="lg" onClick={close}>
                <CloseIcon />
              </IconButton>
            </div>

            {photos.length > 0 ? (
              <div className="relative aspect-[16/10] shrink-0 bg-sbc-black">
                <Image
                  key={`${activeProject.id}-${photoIndex}`}
                  src={photos[photoIndex]}
                  alt={`${activeProject.name} — photo ${photoIndex + 1}`}
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 896px"
                  priority
                />

                {photos.length > 1 && (
                  <>
                    <div className="absolute left-3 top-1/2 -translate-y-1/2">
                      <IconButton
                        label="Previous photo"
                        variant="gallery"
                        size="lg"
                        onClick={() =>
                          setPhotoIndex(
                            (photoIndex - 1 + photos.length) % photos.length
                          )
                        }
                      >
                        <ChevronLeftIcon />
                      </IconButton>
                    </div>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <IconButton
                        label="Next photo"
                        variant="gallery"
                        size="lg"
                        onClick={() =>
                          setPhotoIndex((photoIndex + 1) % photos.length)
                        }
                      >
                        <ChevronRightIcon />
                      </IconButton>
                    </div>

                    <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                      {photos.map((_, i) => (
                        <button
                          key={`${activeProject.id}-dot-${i}`}
                          type="button"
                          aria-label={`Photo ${i + 1}`}
                          aria-current={i === photoIndex}
                          onClick={() => setPhotoIndex(i)}
                          className={`cursor-pointer rounded-full transition-all duration-150 hover:scale-110 ${
                            i === photoIndex
                              ? "h-2.5 w-2.5 bg-sbc-gold shadow-sm"
                              : "h-2 w-2 bg-white/50 hover:bg-white hover:shadow-sm"
                          }`}
                        />
                      ))}
                    </div>

                    <div className="absolute bottom-4 right-4 bg-sbc-black/75 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-white">
                      {photoIndex + 1} / {photos.length}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="relative flex aspect-[16/10] items-end bg-sbc-black p-6">
                <div className="absolute inset-0 bg-linear-to-br from-sbc-black via-[#1a1a1a] to-sbc-gold/30" />
                <p className="relative text-sm font-semibold text-sbc-gold">
                  No photos uploaded for this project yet.
                </p>
              </div>
            )}

            <div className="overflow-y-auto p-6 md:p-8">
              <div>
                <span
                  className={`text-xs uppercase tracking-widest ${getStatusLabelClass(activeProject.status, activeProject.category)}`}
                >
                  {activeProject.status}
                </span>
              </div>
              <h3 className="mt-4 text-xl font-bold text-sbc-black md:text-2xl">
                {activeProject.name}
              </h3>
              <p className="mt-2 text-sm font-semibold text-sbc-gold">
                {activeProject.scope}
              </p>
              <p className="mt-1 text-sm font-medium text-sbc-gray">
                {activeProject.location}
              </p>
              {activeProject.description && (
                <p className="mt-4 text-sm leading-relaxed text-sbc-gray">
                  {activeProject.description}
                </p>
              )}
            </div>

            {projects.length > 1 && (
              <div className="flex shrink-0 items-center justify-between border-t border-sbc-gray-light px-5 py-4">
                <IconButton
                  label="Previous project"
                  variant="gallery"
                  size="lg"
                  onClick={goPrevProject}
                >
                  <ChevronLeftIcon />
                </IconButton>
                <p className="text-xs font-medium text-sbc-gray">
                  {(activeIndex ?? 0) + 1} / {projects.length}
                </p>
                <IconButton
                  label="Next project"
                  variant="gallery"
                  size="lg"
                  onClick={goNextProject}
                >
                  <ChevronRightIcon />
                </IconButton>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
