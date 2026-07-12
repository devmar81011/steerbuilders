import { type ReactNode } from "react";

type SectionProps = {
  children: ReactNode;
  className?: string;
  id?: string;
  dark?: boolean;
};

export function Section({ children, className = "", id, dark = false }: SectionProps) {
  return (
    <section
      id={id}
      className={`py-16 md:py-24 ${dark ? "bg-sbc-black text-sbc-white" : "bg-sbc-off-white text-sbc-black"} ${className}`}
    >
      <div className="mx-auto max-w-6xl px-6 md:px-8">{children}</div>
    </section>
  );
}

type SectionHeaderProps = {
  label?: string;
  title: string;
  description?: string;
  light?: boolean;
};

export function SectionHeader({
  label,
  title,
  description,
  light = false,
}: SectionHeaderProps) {
  return (
    <div className="mb-12 max-w-2xl">
      {label && (
        <p
          className={`mb-3 text-xs font-medium uppercase tracking-widest ${light ? "text-sbc-gold" : "text-sbc-gray"}`}
        >
          {label}
        </p>
      )}
      <h2
        className={`text-2xl font-bold md:text-3xl ${light ? "text-sbc-gold" : "text-sbc-gold"}`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`mt-4 text-base font-semibold leading-relaxed ${light ? "text-sbc-gray-light" : "text-sbc-gray"}`}
        >
          {description}
        </p>
      )}
    </div>
  );
}
