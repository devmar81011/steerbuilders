import { type ButtonHTMLAttributes, type ReactNode } from "react";
import {
  getButtonClassName,
  type ButtonSize,
  type ButtonTone,
  type ButtonVariant,
} from "@/components/ui/button-styles";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  tone?: ButtonTone;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  tone = "light",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={getButtonClassName(variant, size, tone, className)}
      {...props}
    >
      {children}
    </button>
  );
}
