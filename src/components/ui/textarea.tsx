import { type TextareaHTMLAttributes } from "react";

type TextareaTone = "light" | "dark";
type TextareaSize = "sm" | "md";

type TextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "size"> & {
  label?: string;
  tone?: TextareaTone;
  size?: TextareaSize;
};

const toneStyles: Record<TextareaTone, { label: string; input: string }> = {
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

const sizeStyles: Record<TextareaSize, { field: string; label: string }> = {
  sm: {
    label: "text-[10px] tracking-[0.14em]",
    field: "min-h-[96px] px-3 py-2.5 text-sm font-medium",
  },
  md: {
    label: "text-xs tracking-widest",
    field: "min-h-[120px] px-4 py-3.5 text-sm font-semibold",
  },
};

export function Textarea({
  label,
  tone = "light",
  size = "md",
  className = "",
  id,
  ...props
}: TextareaProps) {
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
      <textarea
        id={inputId}
        className={`resize-y leading-relaxed transition-all duration-200 focus:outline-none focus:ring-2 ${styles.input} ${sizing.field} ${className}`}
        {...props}
      />
    </div>
  );
}
