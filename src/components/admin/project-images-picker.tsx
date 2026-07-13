"use client";

import Image from "next/image";
import { ProjectImageUpload } from "@/components/admin/project-image-upload";
import { IconButton, TrashIcon } from "@/components/ui/icon-button";
import { normalizeProjectImages } from "@/lib/project-images";

type Props = {
  images: string[];
  onChange: (images: string[]) => void;
  layout?: "inline" | "modal";
};

export function ProjectImagesPicker({
  images,
  onChange,
  layout = "inline",
}: Props) {
  const normalized = normalizeProjectImages(images);
  const isModal = layout === "modal";

  function appendUrls(urls: string[]) {
    onChange(normalizeProjectImages([...normalized, ...urls]));
  }

  function removeAt(index: number) {
    onChange(normalized.filter((_, i) => i !== index));
  }

  return (
    <div className={isModal ? "space-y-5" : "space-y-3"}>
      <ProjectImageUpload
        onUploaded={appendUrls}
        label={isModal ? "Add project photos" : "Upload Photos"}
      />

      {normalized.length > 0 ? (
        <div
          className={
            isModal
              ? "grid grid-cols-2 gap-3 sm:grid-cols-3"
              : "grid grid-cols-2 gap-2 sm:grid-cols-4"
          }
        >
          {normalized.map((url, index) => (
            <div
              key={`${url}-${index}`}
              className={`group relative overflow-hidden bg-sbc-black ${
                isModal ? "aspect-[4/3]" : "aspect-video border border-sbc-gray-light bg-sbc-off-white"
              }`}
            >
              <Image
                src={url}
                alt={`Project photo ${index + 1}`}
                fill
                unoptimized
                className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />
              <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-sbc-gold via-[#d4a647] to-sbc-gold-dark opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="absolute left-2 top-2 bg-sbc-black/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-white">
                {index + 1}
              </div>
              <IconButton
                label="Remove photo"
                variant="gallery"
                size="sm"
                onClick={() => removeAt(index)}
                className={`absolute right-1.5 top-1.5 bg-sbc-black/50 ${
                  isModal ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
              >
                <TrashIcon />
              </IconButton>
            </div>
          ))}
        </div>
      ) : (
        isModal && (
          <div className="border border-sbc-gray-light/80 bg-sbc-off-white px-4 py-6 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sbc-gold">
              No photos yet
            </p>
            <p className="mt-2 text-sm font-medium text-sbc-gray">
              Upload images to show this project on the portfolio and homepage gallery.
            </p>
          </div>
        )
      )}
    </div>
  );
}
