/** Admin statutory deduction helpers (Pag-IBIG / PhilHealth / SSS). */

export const ADMIN_PAGIBIG_FIXED = 200;

/** PhilHealth employee share: 5% of basic ÷ 2. */
export function computeAdminPhic(basicPay: number): number {
  const basic = Number(basicPay) || 0;
  if (basic <= 0) return 0;
  return Math.round(((basic * 0.05) / 2) * 100) / 100;
}

export function computeAdminPagibig(basicPay?: number | null): number {
  // Fixed ₱200 for admin employees once basic pay is in use / on roster.
  void basicPay;
  return ADMIN_PAGIBIG_FIXED;
}

export type AdminStatutoryDeductions = {
  pagibig: number;
  phic: number;
  /** null = not configured yet */
  sss: number | null;
};

export function computeAdminStatutoryDeductions(
  basicPay: number | null | undefined
): AdminStatutoryDeductions {
  const basic = Number(basicPay) || 0;
  return {
    pagibig: ADMIN_PAGIBIG_FIXED,
    phic: computeAdminPhic(basic),
    sss: null,
  };
}

export function formatDeductionAmount(amount: number | null | undefined): string {
  if (amount == null) return "—";
  return `₱${amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
