import { type ReactNode } from "react";
import { radii } from "@/lib/design-tokens";

type CardProps = {
  children: ReactNode;
  className?: string;
  variant?: "default" | "dark";
};

export function Card({ children, className = "", variant = "default" }: CardProps) {
  const base =
    variant === "dark"
      ? "bg-sbc-black text-sbc-white border-sbc-gray"
      : "bg-sbc-white text-sbc-black border-sbc-gray-light";

  return (
    <div className={`${radii.surface} border p-6 md:p-8 ${base} ${className}`}>{children}</div>
  );
}
