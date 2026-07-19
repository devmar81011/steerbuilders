import { MONTHLY_WORK_DAYS, type RateType } from "@/lib/rate-types";

export function roundPayrollAmount(value: number): number {
  return Math.round(value * 100) / 100;
}

export function derivePayrollRates(
  rate: number,
  rateType: RateType
): { dailyRate: number; hourlyRate: number } {
  const dailyRate =
    rateType === "monthly"
      ? rate / MONTHLY_WORK_DAYS
      : rateType === "hourly"
        ? rate * 8
        : rate;
  const hourlyRate = rateType === "monthly" ? dailyRate / 8 : rateType === "hourly" ? rate : rate / 8;
  return {
    dailyRate: roundPayrollAmount(dailyRate),
    hourlyRate: roundPayrollAmount(hourlyRate),
  };
}

export function calculatePayrollAmounts(input: {
  hourlyRate: number;
  regularHours: number;
  overtimeHours: number;
  cashAdvance?: number;
  additionalPay?: number;
  statutoryDeductions?: number;
}) {
  const regularPay = roundPayrollAmount(input.regularHours * input.hourlyRate);
  const overtimePay = roundPayrollAmount(input.overtimeHours * input.hourlyRate);
  const grossPay = roundPayrollAmount(regularPay + overtimePay);
  const cashAdvance = input.cashAdvance ?? 0;
  const additionalPay = input.additionalPay ?? 0;
  const statutoryDeductions = input.statutoryDeductions ?? 0;
  const netPay = roundPayrollAmount(
    Math.max(grossPay + additionalPay - cashAdvance - statutoryDeductions, 0)
  );

  return { regularPay, overtimePay, grossPay, netPay };
}
