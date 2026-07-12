import { type InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export function Input({ label, className = "", id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium uppercase tracking-widest text-sbc-gray"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`border border-sbc-gray-light bg-sbc-white px-4 py-3 text-sm font-medium text-sbc-black placeholder:text-sbc-gray/60 focus:border-sbc-gold focus:outline-none focus:ring-1 focus:ring-sbc-gold ${className}`}
        {...props}
      />
    </div>
  );
}
