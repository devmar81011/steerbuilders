import { type ReactNode } from "react";

type BadgeProps = {
  children: ReactNode;
  variant?: "gold" | "dark" | "light";
};

const variants = {
  gold: "bg-sbc-gold/15 text-sbc-gold border-sbc-gold/30",
  dark: "bg-sbc-black text-sbc-white border-sbc-black",
  light: "bg-sbc-gray-light/50 text-sbc-gray border-sbc-gray-light",
};

export function Badge({ children, variant = "gold" }: BadgeProps) {
  return (
    <span
      className={`inline-block border px-3 py-1 text-xs font-medium uppercase tracking-widest ${variants[variant]}`}
    >
      {children}
    </span>
  );
}
