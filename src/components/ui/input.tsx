import { type InputHTMLAttributes } from "react";

type InputTone = "light" | "dark";
type InputSize = "sm" | "md";

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label?: string;
  tone?: InputTone;
  size?: InputSize;
};

const toneStyles: Record<InputTone, { label: string; input: string }> = {
  light: {
    label: "text-sbc-gray",
    input:
      "border border-sbc-gray-light/90 bg-sbc-white text-sbc-black shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] placeholder:text-sbc-gray/55 hover:border-sbc-gold/45 focus:border-sbc-gold focus:ring-sbc-gold/20",
  },
  dark: {
    label: "text-sbc-gold",
    input:
      "border border-sbc-gray/50 bg-sbc-black/80 text-sbc-white placeholder:text-sbc-gray shadow-none hover:border-sbc-gold/50 focus:border-sbc-gold focus:ring-sbc-gold/30",
  },
};

const sizeStyles: Record<InputSize, { field: string; label: string }> = {
  sm: {
    label: "text-[10px] tracking-[0.14em]",
    field: "h-10 px-3 text-sm font-medium",
  },
  md: {
    label: "text-xs tracking-widest",
    field: "h-12 px-4 text-sm font-semibold",
  },
};

export function Input({
  label,
  tone = "light",
  size = "md",
  className = "",
  id,
  ...props
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  const styles = toneStyles[tone];
  const sizing = sizeStyles[size];

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className={`font-medium uppercase ${styles.label} ${sizing.label}`}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`transition-all duration-200 focus:outline-none focus:ring-2 ${styles.input} ${sizing.field} ${className}`}
        {...props}
      />
    </div>
  );
}
