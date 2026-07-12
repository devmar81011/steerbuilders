import { AdminShell } from "@/components/layout/admin-shell";
import { PayrollClient } from "@/components/admin/payroll-client";
import {
  getConstructionAttendanceForWeek,
  getHourlyAttendanceForWeek,
} from "@/lib/actions/attendance";
import { getDailyRates } from "@/lib/actions/rates";
import { getPayrollAdjustments } from "@/lib/actions/adjustments";
import { getEmployees, getPayrollEntries } from "@/lib/actions/payroll";
import { getWeekStartsForPayrollPeriod } from "@/lib/payroll-from-attendance";

export default async function PayrollPage() {
  const [payroll, employees, dailyRates, payrollAdjustments] = await Promise.all([
    getPayrollEntries(),
    getEmployees(),
    getDailyRates(),
    getPayrollAdjustments(),
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
    <AdminShell>
      <PayrollClient
        initialConstructionEntries={payroll.constructionEntries}
        initialAdminEntries={payroll.adminEntries}
        initialOjtEntries={payroll.ojtEntries}
        initialConstructionPeriod={constructionPeriod}
        initialAdminPeriod={adminPeriod}
        initialOjtPeriod={ojtPeriod}
        usingDatabase={payroll.usingDatabase}
        employees={employees}
        dailyRates={dailyRates}
        constructionAttendance={constructionAttendance}
        adminAttendance={adminAttendance}
        ojtAttendance={ojtAttendance}
        payrollAdjustments={payrollAdjustments}
      />
    </AdminShell>
  );
}
