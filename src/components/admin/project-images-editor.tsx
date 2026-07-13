"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { updateProject } from "@/lib/actions/projects";
import { ProjectImagesPicker } from "@/components/admin/project-images-picker";
import { CloseIcon, IconButton, textActionGoldClass } from "@/components/ui/icon-button";
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

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  useEffect(() => {
    if (!open) {
      setImages(normalizeProjectImages(initialImages));
    }
  }, [open, initialImages]);

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

  const count = initialImages.length;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${textActionGoldClass} inline-flex items-center gap-2`}
      >
        <span className="inline-flex h-6 min-w-6 items-center justify-center border border-sbc-gold/30 bg-sbc-gold/10 px-1.5 text-[10px] font-bold text-sbc-gold-dark">
          {count}
        </span>
        {count === 0 ? "Add photos" : count === 1 ? "Manage photo" : "Manage photos"}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-sbc-black/70 p-4 md:p-8"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label="Project photo gallery"
        >
          <div
            className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden bg-sbc-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1 shrink-0 bg-linear-to-r from-sbc-gold via-[#d4a647] to-sbc-gold-dark" />

            <div className="flex items-start justify-between gap-4 border-b border-sbc-gray-light px-5 py-4 md:px-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sbc-gold">
                  Project Gallery
                </p>
                <h2 className="mt-1 text-lg font-bold text-sbc-black">Upload & manage photos</h2>
                <p className="mt-1 text-sm font-medium text-sbc-gray">
                  {images.length === 0
                    ? "Add photos for the portfolio and homepage featured section."
                    : `${images.length} photo${images.length === 1 ? "" : "s"} — drag to arrange order`}
                </p>
              </div>
              <IconButton
                label="Close"
                variant="default"
                size="lg"
                onClick={close}
                className="shrink-0"
              >
                <CloseIcon />
              </IconButton>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 md:px-6 md:py-6">
              <ProjectImagesPicker
                images={images}
                onChange={setImages}
                layout="modal"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-sbc-gray-light bg-sbc-off-white px-5 py-4 md:px-6">
              <p className="text-[10px] font-medium uppercase tracking-widest text-sbc-gray">
                Changes apply after you save
              </p>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="ghost" onClick={close}>
                  Cancel
                </Button>
                <Button type="button" size="sm" onClick={handleSave} disabled={pending}>
                  {pending ? "Saving…" : "Save gallery"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
