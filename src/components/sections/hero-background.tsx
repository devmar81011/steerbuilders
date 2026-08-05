"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

/** Unsplash License — free commercial use. See public/hero/ATTRIBUTION.txt */
export const HERO_SLIDES = [
  { src: "/hero/slide-01.jpg", label: "Structure under construction" },
  { src: "/hero/slide-02.jpg", label: "On-site construction crew" },
  { src: "/hero/slide-03.jpg", label: "Active jobsite with trades" },
  { src: "/hero/slide-04.jpg", label: "Completed modern residence" },
  { src: "/hero/slide-05.jpg", label: "Commercial architecture" },
  { src: "/hero/slide-06.jpg", label: "Finished residential home exterior" },
] as const;

const INTERVAL_MS = 8000;
const FADE_MS = 900;

export function HeroBackground() {
  const [index, setIndex] = useState(0);
  // Prefetch the next slide so the crossfade is ready without loading all 6 upfront.
  const nextIndex = (index + 1) % HERO_SLIDES.length;

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % HERO_SLIDES.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden bg-sbc-black" aria-hidden>
      {HERO_SLIDES.map((slide, i) => {
        const active = i === index;
        const prefetch = i === nextIndex;
        if (!active && !prefetch) return null;

        return (
          <div
            key={slide.src}
            className="absolute inset-0"
            style={{
              opacity: active ? 1 : 0,
              transition: `opacity ${FADE_MS}ms ease-in-out`,
              zIndex: active ? 2 : 1,
            }}
          >
            <Image
              src={slide.src}
              alt=""
              fill
              priority={i === 0 && index === 0}
              loading={i === 0 && index === 0 ? "eager" : "lazy"}
              quality={75}
              sizes="100vw"
              className="object-cover object-center"
            />
          </div>
        );
      })}

      <div className="pointer-events-none absolute inset-0 z-[3] bg-linear-to-r from-sbc-black/78 via-sbc-black/50 to-sbc-black/30" />
      <div className="pointer-events-none absolute inset-0 z-[3] bg-sbc-black/10" />

      <div className="absolute bottom-5 left-1/2 z-[5] flex -translate-x-1/2 items-center gap-2.5 md:bottom-7">
        {HERO_SLIDES.map((slide, i) => (
          <button
            key={slide.src}
            type="button"
            aria-label={slide.label}
            onClick={() => setIndex(i)}
            className={`h-2.5 cursor-pointer rounded-sm transition-all duration-300 ${
              i === index
                ? "w-9 bg-sbc-gold"
                : "w-2.5 bg-white/55 hover:bg-white/85"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
