export const DISBURSEMENT_METHODS_KEY = "disbursement_methods";

export const DEFAULT_DISBURSEMENT_METHODS = ["MLhuilier", "BPI"] as const;

export function normalizeDisbursementMethods(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [...DEFAULT_DISBURSEMENT_METHODS];
  }

  const cleaned = value
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);

  return cleaned.length ? Array.from(new Set(cleaned)) : [...DEFAULT_DISBURSEMENT_METHODS];
}
