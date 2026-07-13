"use client";

import { useState, type DragEvent } from "react";
import Image from "next/image";
import { ProjectImageUpload } from "@/components/admin/project-image-upload";
import { IconButton, TrashIcon } from "@/components/ui/icon-button";
import { normalizeProjectImages } from "@/lib/project-images";

type Props = {
  images: string[];
  onChange: (images: string[]) => void;
  layout?: "inline" | "modal";
};

function reorderImages(images: string[], fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex) return images;
  const next = [...images];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

export function ProjectImagesPicker({
  images,
  onChange,
  layout = "inline",
}: Props) {
  const normalized = normalizeProjectImages(images);
  const isModal = layout === "modal";
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  function appendUrls(urls: string[]) {
    onChange(normalizeProjectImages([...normalized, ...urls]));
  }

  function removeAt(index: number) {
    onChange(normalized.filter((_, i) => i !== index));
  }

  function handleDragStart(index: number, event: DragEvent<HTMLDivElement>) {
    setDragIndex(index);
    setOverIndex(index);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(index));
  }

  function handleDragOver(index: number, event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    event.dataTransfer.dropEffect = "move";
    setOverIndex(index);
  }

  function handleDrop(index: number, event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (dragIndex === null) return;
    onChange(reorderImages(normalized, dragIndex, index));
    setDragIndex(null);
    setOverIndex(null);
  }

  function handleDragEnd() {
    setDragIndex(null);
    setOverIndex(null);
  }

  return (
    <div className={isModal ? "space-y-5" : "space-y-3"}>
      <ProjectImageUpload
        onUploaded={appendUrls}
        label={isModal ? "Add project photos" : "Upload Photos"}
      />

      {normalized.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[10px] font-medium uppercase tracking-widest text-sbc-gray">
            Drag photos to arrange display order
          </p>
          <div
            className={
              isModal
                ? "grid grid-cols-2 gap-3 sm:grid-cols-3"
                : "grid grid-cols-2 gap-2 sm:grid-cols-4"
            }
          >
            {normalized.map((url, index) => {
              const isDragging = dragIndex === index;
              const isDropTarget = overIndex === index && dragIndex !== null && !isDragging;

              return (
                <div
                  key={url}
                  draggable
                  onDragStart={(event) => handleDragStart(index, event)}
                  onDragOver={(event) => handleDragOver(index, event)}
                  onDrop={(event) => handleDrop(index, event)}
                  onDragEnd={handleDragEnd}
                  className={`group relative cursor-grab overflow-hidden bg-sbc-black active:cursor-grabbing ${
                    isModal ? "aspect-[4/3]" : "aspect-video border border-sbc-gray-light bg-sbc-off-white"
                  } ${isDragging ? "opacity-40" : ""} ${
                    isDropTarget ? "ring-2 ring-sbc-gold ring-offset-2 ring-offset-sbc-white" : ""
                  }`}
                >
                  <Image
                    src={url}
                    alt={`Project photo ${index + 1}`}
                    fill
                    unoptimized
                    draggable={false}
                    className="pointer-events-none object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  />
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-sbc-gold via-[#d4a647] to-sbc-gold-dark opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="pointer-events-none absolute left-2 top-2 bg-sbc-black/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-white">
                    {index + 1}
                  </div>
                  <div className="pointer-events-none absolute bottom-2 left-2 bg-sbc-black/60 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-white/90 opacity-0 transition-opacity group-hover:opacity-100">
                    Drag
                  </div>
                  <IconButton
                    label="Remove photo"
                    variant="gallery"
                    size="sm"
                    onClick={() => removeAt(index)}
                    onMouseDown={(event) => event.stopPropagation()}
                    className={`absolute right-1.5 top-1.5 bg-sbc-black/50 ${
                      isModal ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    <TrashIcon />
                  </IconButton>
                </div>
              );
            })}
          </div>
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
