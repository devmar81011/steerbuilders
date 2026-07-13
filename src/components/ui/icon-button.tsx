import { type ButtonHTMLAttributes, type ReactNode } from "react";

export type IconButtonVariant = "default" | "danger" | "success" | "gallery";
export type IconButtonSize = "sm" | "md" | "lg";

const iconSizes: Record<IconButtonSize, string> = {
  sm: "!text-[18px]",
  md: "!text-[20px]",
  lg: "!text-[24px]",
};

const variants: Record<IconButtonVariant, string> = {
  default: "text-sbc-gray hover:text-sbc-gold-dark hover:bg-sbc-gold/10",
  danger: "text-sbc-gray hover:text-red-600 hover:bg-red-50",
  success: "text-sbc-gray hover:text-sbc-gold-dark hover:bg-sbc-gold/10",
  gallery: "text-white/90 hover:bg-white/15 hover:text-sbc-gold",
};

const base =
  "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full p-1.5 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sbc-gold/30 disabled:pointer-events-none disabled:opacity-40";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  children: ReactNode;
};

export function IconButton({
  label,
  variant = "default",
  size = "md",
  className = "",
  children,
  ...props
}: Props) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      <span className={iconSizes[size]}>{children}</span>
    </button>
  );
}

export const textActionClass =
  "cursor-pointer rounded-md px-2 py-1 transition-colors duration-150 hover:bg-sbc-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sbc-gold/30";

export const textActionGoldClass = `${textActionClass} text-xs font-semibold uppercase tracking-widest text-sbc-gold hover:text-sbc-gold-dark`;

/** Material Design icons (same glyphs as @mui/icons-material) */

export function EditIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="currentColor" className="block h-[1em] w-[1em]">
      <path d="m14.06 9.02.92.92L5.92 19H5v-.92l9.06-9.06M17.66 3c-.25 0-.51.1-.7.29l-1.83 1.83 3.75 3.75 1.83-1.83c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.2-.2-.45-.29-.71-.29zm-3.6 3.19L3 17.25V21h3.75L17.81 9.94l-3.75-3.75z" />
    </svg>
  );
}

export function TrashIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="currentColor" className="block h-[1em] w-[1em]">
      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM8 9h8v10H8V9zm7.5-5H15v-.5C15 2.67 14.33 2 13.5 2h-3C9.67 2 9 2.67 9 3.5V4H4v2h16V4z" />
    </svg>
  );
}

export function ProcessIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="currentColor" className="block h-[1em] w-[1em]">
      <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </svg>
  );
}

export function ChevronLeftIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="currentColor" className="block h-[1em] w-[1em]">
      <path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
    </svg>
  );
}

export function ChevronRightIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="currentColor" className="block h-[1em] w-[1em]">
      <path d="M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
    </svg>
  );
}

export function CloseIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="currentColor" className="block h-[1em] w-[1em]">
      <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </svg>
  );
}
