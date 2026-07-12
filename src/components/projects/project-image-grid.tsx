"use client";

import Image from "next/image";
import { normalizeProjectImages } from "@/lib/project-images";

type Props = {
  images: string[] | null | undefined;
  alt: string;
  /** compact = 2x2 in cards; featured = larger hero layout on homepage */
  variant?: "compact" | "featured";
};

function Placeholder({ alt, variant }: { alt: string; variant: "compact" | "featured" }) {
  return (
    <div
      className={`relative flex items-end overflow-hidden bg-sbc-black ${
        variant === "featured" ? "aspect-[16/10] min-h-[220px]" : "aspect-[4/3] min-h-[160px]"
      }`}
    >
      <div className="absolute inset-0 bg-linear-to-br from-sbc-black via-[#1a1a1a] to-sbc-gold/30" />
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(135deg,#b88f3f_1px,transparent_1px),linear-gradient(45deg,#b88f3f_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="relative w-full border-t border-sbc-gold/40 bg-sbc-black/50 px-4 py-3 backdrop-blur-sm">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-sbc-gold">
          Project Gallery
        </p>
        <p className="mt-1 truncate text-sm font-semibold text-sbc-white">{alt}</p>
      </div>
    </div>
  );
}

export function ProjectImageGrid({
  images,
  alt,
  variant = "compact",
}: Props) {
  const urls = normalizeProjectImages(images);

  if (urls.length === 0) {
    return <Placeholder alt={alt} variant={variant} />;
  }

  if (urls.length === 1) {
    return (
      <div
        className={`relative overflow-hidden bg-sbc-black ${
          variant === "featured" ? "aspect-[16/10] min-h-[220px]" : "aspect-[4/3] min-h-[160px]"
        }`}
      >
        <Image
          src={urls[0]}
          alt={alt}
          fill
          unoptimized
          className="object-cover transition-transform duration-500 hover:scale-[1.03]"
          sizes={variant === "featured" ? "(max-width: 768px) 100vw, 50vw" : "50vw"}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-linear-to-r from-sbc-gold via-[#d4a647] to-sbc-gold-dark" />
      </div>
    );
  }

  const gridClass =
    variant === "featured"
      ? "grid min-h-[220px] grid-cols-2 grid-rows-2 gap-1"
      : "grid aspect-[4/3] min-h-[160px] grid-cols-2 grid-rows-2 gap-0.5";

  return (
    <div className={`relative overflow-hidden bg-sbc-black ${gridClass}`}>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-1 bg-linear-to-r from-sbc-gold via-[#d4a647] to-sbc-gold-dark" />
      {urls.map((url, index) => (
        <div key={`${url}-${index}`} className="relative overflow-hidden">
          <Image
            src={url}
            alt={`${alt} — photo ${index + 1}`}
            fill
            unoptimized
            className="object-cover transition-transform duration-500 hover:scale-[1.05]"
            sizes="25vw"
          />
        </div>
      ))}
      {urls.length < 4 &&
        Array.from({ length: 4 - urls.length }).map((_, index) => (
          <div
            key={`empty-${index}`}
            className="relative bg-sbc-black/80"
            aria-hidden
          >
            <div className="absolute inset-0 bg-linear-to-br from-sbc-black to-sbc-gold/10" />
          </div>
        ))}
    </div>
  );
}
