import { test, expect } from "@playwright/test";
import { periodFromSheetName } from "../src/lib/payroll-excel-import";
import { getWeeklyPayrollPeriod } from "../src/lib/payroll-periods";

/**
 * Domain logic checks for Construction pay periods.
 * Sheet tabs are entry dates; pay day / label is always that week's Saturday.
 */
test.describe("Construction Saturday pay periods", () => {
  test("7.3.26 (Friday entry) → Saturday July 4, 2026", () => {
    const period = periodFromSheetName("7.3.26");
    expect(period.key).toBe("w-2026-07-04");
    expect(period.label).toBe("July 4, 2026");
    expect(period.processDate).toBe("2026-07-04");
    expect(period.periodStart).toBe("2026-06-29"); // Monday
    expect(period.periodEnd).toBe("2026-07-05"); // Sunday
  });

  test("7.10.26 (Friday entry) → Saturday July 11, 2026", () => {
    const period = periodFromSheetName("7.10.26");
    expect(period.key).toBe("w-2026-07-11");
    expect(period.label).toBe("July 11, 2026");
    expect(period.periodStart).toBe("2026-07-06");
    expect(period.periodEnd).toBe("2026-07-12");
  });

  test("Saturday sheet tab stays on that Saturday", () => {
    const period = periodFromSheetName("7.4.26");
    expect(period.key).toBe("w-2026-07-04");
    expect(period.label).toBe("July 4, 2026");
  });

  test("getWeeklyPayrollPeriod anchors any weekday to Saturday", () => {
    const fromMonday = getWeeklyPayrollPeriod("2026-07-06");
    expect(fromMonday.processDate).toBe("2026-07-11");
    expect(fromMonday.label).toBe("July 11, 2026");
  });
});
