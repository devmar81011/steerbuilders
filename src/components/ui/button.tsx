import { type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-sbc-gold text-sbc-white hover:bg-sbc-gold-dark border border-sbc-gold",
  secondary:
    "bg-sbc-black text-sbc-white hover:bg-sbc-gray border border-sbc-black",
  outline:
    "bg-transparent text-sbc-black border border-sbc-black hover:bg-sbc-black hover:text-sbc-white",
  ghost: "bg-transparent text-sbc-gold hover:text-sbc-gold-dark border-transparent",
};

const sizeStyles: Record<Size, string> = {
  sm: "px-4 py-2 text-xs",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-base",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center font-semibold uppercase tracking-wider transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
