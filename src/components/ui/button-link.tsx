import Link from "next/link";
import { type ComponentProps, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";
type Tone = "light" | "dark";

const variantStyles: Record<Tone, Record<Variant, string>> = {
  light: {
    primary:
      "bg-sbc-gold text-sbc-white border border-sbc-gold hover:bg-sbc-gold-dark hover:text-sbc-white",
    secondary:
      "bg-sbc-black text-sbc-white border border-sbc-black hover:bg-sbc-gray hover:text-sbc-white",
    outline:
      "bg-transparent text-sbc-black border border-sbc-black hover:bg-sbc-black hover:text-sbc-white",
    ghost:
      "bg-transparent text-sbc-gold border border-transparent hover:bg-sbc-gold/10 hover:text-sbc-gold-dark",
  },
  dark: {
    primary:
      "bg-sbc-gold text-sbc-white border border-sbc-gold hover:bg-sbc-gold-dark hover:text-sbc-white",
    secondary:
      "bg-sbc-white text-sbc-black border border-sbc-white hover:bg-sbc-off-white hover:text-sbc-black",
    outline:
      "bg-transparent text-sbc-white border border-sbc-white hover:bg-sbc-white hover:text-sbc-black",
    ghost:
      "bg-transparent text-sbc-gold border border-transparent hover:bg-sbc-white/10 hover:text-sbc-white",
  },
};

const sizeStyles: Record<Size, string> = {
  sm: "px-4 py-2 text-xs",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-base",
};

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: Variant;
  size?: Size;
  tone?: Tone;
  children: ReactNode;
};

export function ButtonLink({
  variant = "primary",
  size = "md",
  tone = "light",
  className = "",
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={`inline-flex items-center justify-center font-semibold uppercase tracking-wider transition-colors duration-200 ${variantStyles[tone][variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}
