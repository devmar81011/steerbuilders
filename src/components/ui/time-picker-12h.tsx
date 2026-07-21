"use client";

import {
  formatTime12,
  getHourOptions,
  joinTime24,
  normalizeHourForPeriod,
  normalizeTime24,
  splitTime24,
  TIME_MINUTE_OPTIONS,
  type TimePeriod,
} from "@/lib/time-format";

type Props = {
  value: string;
  onChange: (value: string) => void;
  label: string;
  disabled?: boolean;
};

export function TimePicker12h({ value, onChange, label, disabled }: Props) {
  const normalized = normalizeTime24(value);
  const parts = splitTime24(normalized);
  const hourOptions = getHourOptions(parts.period);

  function update(next: Partial<typeof parts>) {
    const merged = { ...parts, ...next };

    if (next.period && next.period !== parts.period) {
      if (parts.hour === "00" && merged.period === "PM") {
        merged.hour = "12";
      } else if (parts.hour === "12" && merged.period === "AM") {
        merged.hour = "00";
      } else {
        merged.hour = normalizeHourForPeriod(merged.hour, merged.period);
      }
    }

    onChange(joinTime24(merged));
  }

  const selectClass =
    "h-7 cursor-pointer rounded-md border border-sbc-gray-light/90 bg-sbc-white px-1 text-[10px] font-medium text-sbc-black transition-colors hover:border-sbc-gold/45 focus:border-sbc-gold focus:outline-none focus:ring-2 focus:ring-sbc-gold/20 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <label className="block">
      <span className="mb-0.5 block text-[9px] font-medium uppercase tracking-[0.1em] text-sbc-gray">
        {label}
      </span>
      <div className="flex items-center gap-0.5" title={formatTime12(normalized)}>
        <select
          aria-label={`${label} hour`}
          disabled={disabled}
          value={parts.hour}
          onChange={(e) => update({ hour: e.target.value })}
          className={`${selectClass} w-[34px]`}
        >
          {hourOptions.map((hour) => (
            <option key={hour} value={hour}>
              {hour}
            </option>
          ))}
        </select>
        <span className="text-[10px] font-semibold text-sbc-gray">:</span>
        <select
          aria-label={`${label} minute`}
          disabled={disabled}
          value={parts.minute}
          onChange={(e) => update({ minute: e.target.value })}
          className={`${selectClass} w-[34px]`}
        >
          {TIME_MINUTE_OPTIONS.map((minute) => (
            <option key={minute} value={minute}>
              {minute}
            </option>
          ))}
        </select>
        <select
          aria-label={`${label} period`}
          disabled={disabled}
          value={parts.period}
          onChange={(e) => update({ period: e.target.value as TimePeriod })}
          className={`${selectClass} w-[38px]`}
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </label>
  );
}
