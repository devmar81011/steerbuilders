/**
 * Steer Builders Corporation — design tokens
 * Maps to Tailwind theme in globals.css
 */
export const colors = {
  black: "#101010",
  gray: "#818181",
  grayLight: "#e1e1e1",
  offWhite: "#fcfcfc",
  gold: "#b88f3f",
  goldDark: "#96732f",
  white: "#ffffff",
} as const;

export const fonts = {
  sans: "var(--font-montserrat)",
} as const;

export const typography = {
  display: "text-4xl md:text-5xl lg:text-6xl font-normal uppercase tracking-wide",
  h1: "text-3xl md:text-4xl font-normal uppercase tracking-wide",
  h2: "text-2xl md:text-3xl font-bold text-sbc-gold",
  h3: "text-xl font-bold text-sbc-black",
  body: "text-base font-semibold text-sbc-gray leading-relaxed",
  bodySmall: "text-sm font-medium text-sbc-gray leading-relaxed",
  label: "text-xs font-medium uppercase tracking-widest text-sbc-gray",
} as const;

/** Shared corner radius for controls (buttons, inputs) and surfaces (cards, panels). */
export const radii = {
  control: "rounded-md",
  surface: "rounded-lg",
} as const;
