"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/button-link";
import {
  IconButton,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
} from "@/components/ui/circle-button";
import { Section, SectionHeader } from "@/components/ui/section";
import { ProjectImageGrid } from "@/components/projects/project-image-grid";
import { HOMEPAGE_PREVIEW_IMAGE_COUNT } from "@/lib/project-images";
import { getStatusLabelClass } from "@/lib/project-status";

export type FeaturedProject = {
  id: string;
  name: string;
  scope: string;
  location: string;
  status: string;
  description: string | null;
  images: string[];
};

type Props = {
  projects: FeaturedProject[];
};

export function FeaturedProjectsGallery({ projects }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);

  const activeProject = activeIndex !== null ? projects[activeIndex] : null;
  const photos = activeProject?.images ?? [];

  const close = useCallback(() => {
    setActiveIndex(null);
    setPhotoIndex(0);
  }, []);

  const goNext = useCallback(() => {
    if (activeIndex === null) return;
    setActiveIndex((activeIndex + 1) % projects.length);
    setPhotoIndex(0);
  }, [activeIndex, projects.length]);

  const goPrev = useCallback(() => {
    if (activeIndex === null) return;
    setActiveIndex((activeIndex - 1 + projects.length) % projects.length);
    setPhotoIndex(0);
  }, [activeIndex, projects.length]);

  useEffect(() => {
    if (activeIndex === null) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") {
        if (e.shiftKey) goNext();
        else setPhotoIndex((i) => (i + 1) % Math.max(photos.length, 1));
      }
      if (e.key === "ArrowLeft") {
        if (e.shiftKey) goPrev();
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
  }, [activeIndex, close, goNext, goPrev, photos.length]);

  return (
    <Section id="projects">
      <SectionHeader
        label="Portfolio"
        title="Featured Projects"
        description="A selection of completed and ongoing engagements across Cebu, Bohol, Iloilo, and Cagayan de Oro."
      />
      <div className="grid gap-8 md:grid-cols-2">
        {projects.map((project, index) => (
          <button
            key={project.id}
            type="button"
            className="group w-full cursor-pointer overflow-hidden rounded-lg border border-sbc-gray-light bg-sbc-white text-left transition-colors hover:border-sbc-gold/50"
            onClick={() => {
              setActiveIndex(index);
              setPhotoIndex(0);
            }}
          >
            <div className="relative">
              <ProjectImageGrid
                images={project.images}
                alt={project.name}
                variant="featured"
                previewLimit={HOMEPAGE_PREVIEW_IMAGE_COUNT}
              />
              <div className="pointer-events-none absolute inset-0 bg-sbc-black/0 transition-colors group-hover:bg-sbc-black/25" />
              <div className="pointer-events-none absolute bottom-4 left-4 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="bg-sbc-black/80 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-white">
                  View Project
                </span>
              </div>
            </div>
            <div className="border-t border-sbc-gray-light p-6">
              <div className="mb-3">
                <span
                  className={`text-[10px] uppercase tracking-widest ${getStatusLabelClass(project.status)}`}
                >
                  {project.status}
                </span>
              </div>
              <h3 className="text-lg font-bold text-sbc-black group-hover:text-sbc-gold">
                {project.name}
              </h3>
              <p className="mt-2 text-sm font-semibold text-sbc-gold">{project.scope}</p>
              <p className="mt-2 text-sm font-medium text-sbc-gray">{project.location}</p>
            </div>
          </button>
        ))}
      </div>
      <div className="mt-8">
        <ButtonLink href="/projects" variant="outline">
          View Full Portfolio
        </ButtonLink>
      </div>

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
                          key={i}
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
                  </>
                )}
              </div>
            ) : (
              <ProjectImageGrid
                images={[]}
                alt={activeProject.name}
                variant="featured"
              />
            )}

            <div className="overflow-y-auto p-6 md:p-8">
              <div>
                <span
                  className={`text-xs uppercase tracking-widest ${getStatusLabelClass(activeProject.status)}`}
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
                <IconButton label="Previous project" variant="gallery" size="lg" onClick={goPrev}>
                  <ChevronLeftIcon />
                </IconButton>
                <p className="text-xs font-medium text-sbc-gray">
                  {(activeIndex ?? 0) + 1} / {projects.length}
                </p>
                <IconButton label="Next project" variant="gallery" size="lg" onClick={goNext}>
                  <ChevronRightIcon />
                </IconButton>
              </div>
            )}
          </div>
        </div>
      )}
    </Section>
  );
}
