import { type SelectHTMLAttributes } from "react";
import { radii } from "@/lib/design-tokens";

type SelectSize = "sm" | "md";

function ChevronDown({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M5 7.5L10 12.5L15 7.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> & {
  label?: string;
  size?: SelectSize;
};

const sizeStyles: Record<
  SelectSize,
  { field: string; chevron: string; icon: string; label: string }
> = {
  sm: {
    label: "text-[10px] tracking-[0.14em]",
    field: "h-10 py-0 pl-3 pr-11 text-sm font-medium",
    chevron: "w-10",
    icon: "h-4 w-4",
  },
  md: {
    label: "text-xs tracking-widest",
    field: "h-12 py-0 pl-4 pr-12 text-sm font-semibold",
    chevron: "w-11",
    icon: "h-4 w-4",
  },
};

export function Select({
  label,
  size = "md",
  className = "",
  id,
  children,
  ...props
}: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  const styles = sizeStyles[size];

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className={`font-medium uppercase text-sbc-gray ${styles.label}`}
        >
          {label}
        </label>
      )}
      <div className={`group relative overflow-hidden ${radii.control}`}>
        <select
          id={selectId}
          className={`sbc-select w-full cursor-pointer appearance-none border border-sbc-gray-light/90 bg-sbc-white text-sbc-black shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] transition-all duration-200 hover:border-sbc-gold/45 focus:border-sbc-gold focus:outline-none focus:ring-2 focus:ring-sbc-gold/20 ${styles.field} ${className}`}
          {...props}
        >
          {children}
        </select>
        <span
          className={`pointer-events-none absolute inset-y-0 right-0 flex items-center justify-center border-l border-sbc-gold/25 bg-sbc-off-white transition-colors group-hover:border-sbc-gold/40 group-hover:bg-sbc-gold/10 group-focus-within:border-sbc-gold/50 group-focus-within:bg-sbc-gold/10 ${styles.chevron}`}
        >
          <ChevronDown className={`${styles.icon} text-sbc-gold`} />
        </span>
      </div>
    </div>
  );
}
