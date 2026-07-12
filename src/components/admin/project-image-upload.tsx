"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  onUploaded: (urls: string[]) => void;
  currentCount?: number;
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
  disabled,
  label = "Upload Photos",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

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

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || uploading}
      />
      <Button
        type="button"
        size="sm"
        variant="secondary"
        disabled={disabled || uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? "Uploading…" : label}
      </Button>
      {currentCount > 0 && (
        <p className="mt-1 text-[10px] font-medium text-sbc-gray">
          {currentCount} photo{currentCount === 1 ? "" : "s"} uploaded
        </p>
      )}
      {error && (
        <p className="mt-1 text-xs font-semibold text-red-600">{error}</p>
      )}
    </div>
  );
}
