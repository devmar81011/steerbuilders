import { PayrollClient } from "@/components/admin/payroll-client";
import {
  getConstructionAttendanceForWeek,
  getHourlyAttendanceForWeek,
} from "@/lib/actions/attendance";
import { getPayrollAdjustments } from "@/lib/actions/adjustments";
import { getEmployees, getPayrollEntries } from "@/lib/actions/payroll";
import { getDisbursementMethods } from "@/lib/actions/site-settings";
import { getWeekStartsForPayrollPeriod } from "@/lib/payroll-from-attendance";

export default async function PayrollPage() {
  const [payroll, employees, payrollAdjustments, disbursementMethods] =
    await Promise.all([
      getPayrollEntries(),
      getEmployees(),
      getPayrollAdjustments(),
      getDisbursementMethods(),
    ]);

  const { constructionPeriod, adminPeriod, ojtPeriod } = payroll;
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
        initialConstructionEntries={payroll.constructionEntries}
        initialAdminEntries={payroll.adminEntries}
        initialOjtEntries={payroll.ojtEntries}
        initialConstructionPeriod={constructionPeriod}
        initialAdminPeriod={adminPeriod}
        initialOjtPeriod={ojtPeriod}
        usingDatabase={payroll.usingDatabase}
        employees={employees}
        constructionAttendance={constructionAttendance}
        adminAttendance={adminAttendance}
        ojtAttendance={ojtAttendance}
        payrollAdjustments={payrollAdjustments}
        disbursementMethods={disbursementMethods}
    />
  );
}
