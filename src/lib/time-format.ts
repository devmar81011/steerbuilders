export type TimePeriod = "AM" | "PM";

export type Time12Parts = {
  hour: string;
  minute: string;
  period: TimePeriod;
};

const EMPTY_24H = "00:00";

export function normalizeTime24(value: string | null | undefined): string {
  if (!value) return EMPTY_24H;
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return EMPTY_24H;
  const hour = Math.min(23, Math.max(0, Number(match[1])));
  const minute = Math.min(59, Math.max(0, Number(match[2])));
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function splitTime24(value: string | null | undefined): Time12Parts {
  const normalized = normalizeTime24(value);
  const [hour24, minute] = normalized.split(":").map(Number);

  if (hour24 === 0) {
    return { hour: "00", minute: String(minute).padStart(2, "0"), period: "AM" };
  }

  if (hour24 === 12) {
    return { hour: "12", minute: String(minute).padStart(2, "0"), period: "PM" };
  }

  if (hour24 > 12) {
    return {
      hour: String(hour24 - 12).padStart(2, "0"),
      minute: String(minute).padStart(2, "0"),
      period: "PM",
    };
  }

  return {
    hour: String(hour24).padStart(2, "0"),
    minute: String(minute).padStart(2, "0"),
    period: "AM",
  };
}

export function joinTime24(parts: Time12Parts): string {
  const minute = String(Number(parts.minute) || 0).padStart(2, "0");
  let hour = Number(parts.hour);

  if (parts.period === "AM") {
    if (hour === 12) hour = 0;
    if (hour === 0) hour = 0;
  } else if (hour === 12) {
    hour = 12;
  } else {
    hour += 12;
  }

  return `${String(hour).padStart(2, "0")}:${minute}`;
}

export function formatTime12(value: string | null | undefined): string {
  const parts = splitTime24(value);
  return `${parts.hour}:${parts.minute} ${parts.period}`;
}

export function isMidnightTime(value: string | null | undefined): boolean {
  return normalizeTime24(value) === EMPTY_24H;
}

export const TIME_HOUR_OPTIONS_AM = Array.from({ length: 12 }, (_, index) =>
  String(index).padStart(2, "0")
);

export const TIME_HOUR_OPTIONS_PM = [
  "12",
  ...Array.from({ length: 11 }, (_, index) => String(index + 1).padStart(2, "0")),
];

export const TIME_MINUTE_OPTIONS = Array.from({ length: 60 }, (_, index) =>
  String(index).padStart(2, "0")
);

export function getHourOptions(period: TimePeriod): string[] {
  return period === "AM" ? TIME_HOUR_OPTIONS_AM : TIME_HOUR_OPTIONS_PM;
}

export function normalizeHourForPeriod(hour: string, period: TimePeriod): string {
  const options = getHourOptions(period);
  if (options.includes(hour)) return hour;
  return options[0];
}
