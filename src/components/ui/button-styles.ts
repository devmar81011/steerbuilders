export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";
export type ButtonTone = "light" | "dark";

export const buttonBase =
  "relative inline-flex cursor-pointer items-center justify-center gap-2 font-semibold uppercase tracking-[0.12em] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sbc-gold/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]";

export const buttonSizes: Record<ButtonSize, string> = {
  sm: "min-h-9 px-4 text-[11px]",
  md: "min-h-11 px-6 text-xs",
  lg: "min-h-12 px-8 text-sm",
};

export const buttonVariants: Record<ButtonTone, Record<ButtonVariant, string>> = {
  light: {
    primary:
      "bg-sbc-gold text-sbc-white border border-sbc-gold hover:bg-sbc-gold-dark hover:border-sbc-gold-dark",
    secondary:
      "bg-sbc-gold/10 text-sbc-gold-dark border border-sbc-gold/40 hover:bg-sbc-gold/20 hover:border-sbc-gold",
    outline:
      "bg-sbc-white text-sbc-gold-dark border border-sbc-gold/50 hover:bg-sbc-gold/8 hover:border-sbc-gold",
    ghost:
      "bg-transparent text-sbc-gold border border-transparent hover:bg-sbc-gold/10 hover:text-sbc-gold-dark",
  },
  dark: {
    primary:
      "bg-sbc-gold text-sbc-white border border-sbc-gold hover:bg-sbc-gold-dark hover:border-sbc-gold-dark",
    secondary:
      "bg-white/10 text-sbc-white border border-white/30 hover:bg-white/20",
    outline:
      "bg-transparent text-sbc-white border border-white/70 hover:bg-white/10 hover:border-white",
    ghost:
      "bg-transparent text-sbc-gold border border-transparent hover:bg-white/10 hover:text-sbc-white",
  },
};

export function getButtonClassName(
  variant: ButtonVariant,
  size: ButtonSize,
  tone: ButtonTone,
  className = ""
) {
  return `${buttonBase} ${buttonSizes[size]} ${buttonVariants[tone][variant]} ${className}`.trim();
}
