"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { MAX_PROJECT_IMAGES } from "@/lib/project-images";

type Props = {
  onUploaded: (urls: string[]) => void;
  currentCount?: number;
  max?: number;
  disabled?: boolean;
  label?: string;
};

async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/upload/project-image", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Upload failed.");
  return data.url as string;
}

export function ProjectImageUpload({
  onUploaded,
  currentCount = 0,
  max = MAX_PROJECT_IMAGES,
  disabled,
  label = "Upload Photos",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = max - currentCount;
  const canUpload = remaining > 0;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || !canUpload) return;

    const batch = files.slice(0, remaining);
    setUploading(true);
    setError(null);

    try {
      const urls: string[] = [];
      for (const file of batch) {
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

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || uploading || !canUpload}
      />
      <Button
        type="button"
        size="sm"
        variant="secondary"
        disabled={disabled || uploading || !canUpload}
        onClick={() => inputRef.current?.click()}
      >
        {uploading
          ? "Uploading…"
          : canUpload
            ? `${label} (${currentCount}/${max})`
            : "Maximum photos reached"}
      </Button>
      {canUpload && (
        <p className="mt-1 text-[10px] font-medium text-sbc-gray">
          Select up to {remaining} image{remaining === 1 ? "" : "s"} at once
        </p>
      )}
      {error && (
        <p className="mt-1 text-xs font-semibold text-red-600">{error}</p>
      )}
    </div>
  );
}
