import { PayrollClient } from "@/components/admin/payroll-client";
import {
  getConstructionAttendanceForWeek,
  getHourlyAttendanceForWeek,
} from "@/lib/actions/attendance";
import { getPayrollAdjustments } from "@/lib/actions/adjustments";
import { getEmployees } from "@/lib/actions/payroll";
import { getDisbursementMethods, getOtPayPercent } from "@/lib/actions/site-settings";
import { getWeekStartsForPayrollPeriod } from "@/lib/payroll-from-attendance";
import { getCurrentPayrollPeriod } from "@/lib/payroll-periods";

export default async function PayrollPage() {
  const constructionPeriod = getCurrentPayrollPeriod("construction");
  const adminPeriod = getCurrentPayrollPeriod("admin");
  const ojtPeriod = getCurrentPayrollPeriod("ojt");

  const [employees, payrollAdjustments, disbursementMethods, otPayPercent] =
    await Promise.all([
      getEmployees(),
      getPayrollAdjustments(),
      getDisbursementMethods(),
      getOtPayPercent(),
    ]);

  const { rows: constructionAttendance } =
    await getConstructionAttendanceForWeek(constructionPeriod.periodStart);

  const adminWeekStarts = getWeekStartsForPayrollPeriod("admin", adminPeriod);
  const adminAttendance = (
    await Promise.all(
      adminWeekStarts.map((weekStart) =>
        getHourlyAttendanceForWeek(weekStart, "admin")
      )
    )
  ).flatMap((result) => result.rows);

  const ojtWeekStarts = getWeekStartsForPayrollPeriod("ojt", ojtPeriod);
  const ojtAttendance = (
    await Promise.all(
      ojtWeekStarts.map((weekStart) =>
        getHourlyAttendanceForWeek(weekStart, "ojt")
      )
    )
  ).flatMap((result) => result.rows);

  return (
    <PayrollClient
      initialConstructionEntries={[]}
      initialAdminEntries={[]}
      initialOjtEntries={[]}
      initialConstructionPeriod={constructionPeriod}
      initialAdminPeriod={adminPeriod}
      initialOjtPeriod={ojtPeriod}
      usingDatabase={false}
      employees={employees}
      constructionAttendance={constructionAttendance}
      adminAttendance={adminAttendance}
      ojtAttendance={ojtAttendance}
      payrollAdjustments={payrollAdjustments}
      disbursementMethods={disbursementMethods}
      otPayPercent={otPayPercent}
    />
  );
}
