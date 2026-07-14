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
const SLIDE_MS = 1600;

export function HeroBackground() {
  // Extra clone of first slide at the end for seamless wrap
  const track = [...HERO_SLIDES, HERO_SLIDES[0]];
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    const id = window.setInterval(() => {
      setAnimate(true);
      setIndex((i) => i + 1);
    }, INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (index !== HERO_SLIDES.length) return;

    const t = window.setTimeout(() => {
      setAnimate(false);
      setIndex(0);
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setAnimate(true));
      });
    }, SLIDE_MS);

    return () => window.clearTimeout(t);
  }, [index]);

  const activeDot = index % HERO_SLIDES.length;
  const slidePct = 100 / track.length;

  return (
    <div className="absolute inset-0 overflow-hidden bg-sbc-black" aria-hidden>
      <div
        className="flex h-full will-change-transform"
        style={{
          width: `${track.length * 100}%`,
          transform: `translate3d(-${index * slidePct}%, 0, 0)`,
          transition: animate
            ? `transform ${SLIDE_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`
            : "none",
        }}
      >
        {track.map((slide, i) => (
          <div
            key={`${slide.src}-${i}`}
            className="relative h-full shrink-0"
            style={{ width: `${slidePct}%` }}
          >
            <Image
              src={slide.src}
              alt=""
              fill
              priority={i === 0}
              sizes="100vw"
              className="object-cover object-center"
            />
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-sbc-black/78 via-sbc-black/50 to-sbc-black/30" />
      <div className="pointer-events-none absolute inset-0 bg-sbc-black/10" />

      <div className="absolute bottom-5 left-1/2 z-[5] flex -translate-x-1/2 items-center gap-2.5 md:bottom-7">
        {HERO_SLIDES.map((slide, i) => (
          <button
            key={slide.src}
            type="button"
            aria-label={slide.label}
            onClick={() => {
              setAnimate(true);
              setIndex(i);
            }}
            className={`h-2.5 cursor-pointer rounded-sm transition-all duration-300 ${
              i === activeDot
                ? "w-9 bg-sbc-gold"
                : "w-2.5 bg-white/55 hover:bg-white/85"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
