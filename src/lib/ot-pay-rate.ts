export const OT_PAY_PERCENT_KEY = "ot_pay_percent";

/** Matches the operations Excel sample (OT at normal hourly rate). */
export const DEFAULT_OT_PAY_PERCENT = 100;

export function clampOtPayPercent(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_OT_PAY_PERCENT;
  return Math.min(Math.max(Math.round(value * 100) / 100, 0), 300);
}

export function normalizeOtPayPercent(value: unknown): number {
  if (typeof value === "number") return clampOtPayPercent(value);
  const parsed = Number.parseFloat(String(value ?? ""));
  return clampOtPayPercent(parsed);
}

/** Convert stored percent (100, 125) to multiplier (1, 1.25). */
export function otPayMultiplierFromPercent(percent: number): number {
  return clampOtPayPercent(percent) / 100;
}
