import Link from "next/link";
import { type ComponentProps, type ReactNode } from "react";
import {
  getButtonClassName,
  type ButtonSize,
  type ButtonTone,
  type ButtonVariant,
} from "@/components/ui/button-styles";

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  tone?: ButtonTone;
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
      className={getButtonClassName(variant, size, tone, className)}
      {...props}
    >
      {children}
    </Link>
  );
}
