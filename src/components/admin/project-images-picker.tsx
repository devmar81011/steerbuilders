"use client";

import Image from "next/image";
import { ProjectImageUpload } from "@/components/admin/project-image-upload";
import { MAX_PROJECT_IMAGES, normalizeProjectImages } from "@/lib/project-images";

type Props = {
  images: string[];
  onChange: (images: string[]) => void;
};

export function ProjectImagesPicker({ images, onChange }: Props) {
  const normalized = normalizeProjectImages(images);

  function appendUrls(urls: string[]) {
    onChange(normalizeProjectImages([...normalized, ...urls]));
  }

  function removeAt(index: number) {
    onChange(normalized.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <ProjectImageUpload
        currentCount={normalized.length}
        onUploaded={appendUrls}
        label="Upload Photos"
      />

      {normalized.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {normalized.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className="group relative aspect-video overflow-hidden border border-sbc-gray-light bg-sbc-off-white"
            >
              <Image
                src={url}
                alt={`Project photo ${index + 1}`}
                fill
                unoptimized
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => removeAt(index)}
                className="absolute right-1 top-1 bg-sbc-gold/90 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
