"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { updateProject } from "@/lib/actions/projects";
import { ProjectImagesPicker } from "@/components/admin/project-images-picker";
import { textActionGoldClass } from "@/components/ui/icon-button";
import { normalizeProjectImages } from "@/lib/project-images";

type Props = {
  projectId: string;
  initialImages: string[];
  disabled?: boolean;
  persistToServer?: boolean;
  onSaved?: (images: string[]) => void;
};

export function ProjectImagesEditor({
  projectId,
  initialImages,
  disabled,
  persistToServer = true,
  onSaved,
}: Props) {
  const [open, setOpen] = useState(false);
  const [images, setImages] = useState(() => normalizeProjectImages(initialImages));
  const [pending, startTransition] = useTransition();

  function handleSave() {
    const next = normalizeProjectImages(images);
    startTransition(async () => {
      if (!persistToServer) {
        onSaved?.(next);
        setOpen(false);
        return;
      }

      const result = await updateProject(projectId, { images: next });
      if (!result.error) {
        onSaved?.(next);
        setOpen(false);
      }
    });
  }

  if (disabled) {
    return (
      <span className="text-xs font-medium text-sbc-gray">
        {initialImages.length} photo{initialImages.length === 1 ? "" : "s"}
      </span>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={textActionGoldClass}
      >
        {initialImages.length} photo{initialImages.length === 1 ? "" : "s"}
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-[min(100vw-2rem,28rem)] border border-sbc-gray-light bg-sbc-white p-4 shadow-lg">
          <p className="mb-3 text-[10px] font-medium uppercase tracking-widest text-sbc-gray">
            Project photos
          </p>
          <ProjectImagesPicker images={images} onChange={setImages} />
          <div className="mt-4 flex gap-2">
            <Button type="button" size="sm" onClick={handleSave} disabled={pending}>
              Save
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
