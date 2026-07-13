"use client";

import { useRef, useState, type DragEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { isAllowedUploadImage, UPLOAD_IMAGE_ACCEPT } from "@/lib/upload-image-types";

type Props = {
  onUploaded: (urls: string[]) => void;
  currentCount?: number;
  disabled?: boolean;
  label?: string;
};

async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: HeadersInit = {};
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  const res = await fetch("/api/upload/project-image", {
    method: "POST",
    body: formData,
    credentials: "include",
    headers,
  });

  let data: { error?: string; url?: string };
  try {
    data = await res.json();
  } catch {
    throw new Error(`Upload failed (${res.status}).`);
  }

  if (!res.ok) throw new Error(data.error ?? `Upload failed (${res.status}).`);
  if (!data.url) throw new Error("Upload failed: no image URL returned.");
  return data.url;
}

function UploadCloudIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className="h-8 w-8"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
      />
    </svg>
  );
}

export function ProjectImageUpload({
  onUploaded,
  disabled,
  label = "Upload Photos",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadFiles(files: File[]) {
    if (!files.length || disabled || uploading) return;

    setUploading(true);
    setError(null);

    try {
      const urls: string[] = [];
      for (const file of files) {
        urls.push(await uploadFile(file));
      }
      onUploaded(urls);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    await uploadFiles(Array.from(e.target.files ?? []));
  }

  function handleDragEnter(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !uploading) setDragging(true);
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) setDragging(false);
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  async function handleDrop(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    if (disabled || uploading) return;

    const files = Array.from(e.dataTransfer.files).filter(isAllowedUploadImage);
    await uploadFiles(files);
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={UPLOAD_IMAGE_ACCEPT}
        multiple
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || uploading}
      />

      <button
        type="button"
        disabled={disabled || uploading}
        onClick={() => inputRef.current?.click()}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`group relative w-full overflow-hidden rounded-lg border-2 border-dashed px-6 py-8 text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sbc-gold/40 disabled:cursor-not-allowed disabled:opacity-60 ${
          dragging
            ? "border-sbc-gold bg-sbc-gold/10"
            : "border-sbc-gray-light/80 bg-linear-to-br from-sbc-off-white via-sbc-white to-sbc-gold/5 hover:border-sbc-gold/50 hover:bg-sbc-gold/5"
        }`}
      >
        <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(135deg,#b88f3f_1px,transparent_1px),linear-gradient(45deg,#b88f3f_1px,transparent_1px)] [background-size:20px_20px]" />

        <div className="relative flex flex-col items-center gap-3">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-full border transition-colors ${
              dragging
                ? "border-sbc-gold bg-sbc-gold/15 text-sbc-gold-dark"
                : "border-sbc-gold/30 bg-sbc-white text-sbc-gold group-hover:border-sbc-gold/60 group-hover:bg-sbc-gold/10"
            }`}
          >
            {uploading ? (
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-sbc-gold/30 border-t-sbc-gold" />
            ) : (
              <UploadCloudIcon />
            )}
          </div>

          <div>
            <p className="text-sm font-semibold text-sbc-black">
              {uploading ? "Uploading photos…" : dragging ? "Drop to upload" : label}
            </p>
            <p className="mt-1 text-xs font-medium text-sbc-gray">
              Drag & drop or click to browse
            </p>
          </div>

          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-sbc-gray">
            JPG · PNG · WebP · HEIC · up to 5 MB
          </p>
        </div>
      </button>

      {error && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
