import { PayrollClient } from "@/components/admin/payroll-client";
import { getPayrollAdjustments } from "@/lib/actions/adjustments";
import { getEmployees } from "@/lib/actions/payroll";
import {
  getDisbursementMethods,
  getOtPayPercent,
} from "@/lib/actions/site-settings";
import { getCurrentPayrollPeriod, type PayrollTab } from "@/lib/payroll-periods";

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const initialTab: PayrollTab =
    params.tab === "admin" ? "admin" : "construction";

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

  return (
    <PayrollClient
      initialConstructionEntries={[]}
      initialAdminEntries={[]}
      initialOjtEntries={[]}
      initialConstructionPeriod={constructionPeriod}
      initialAdminPeriod={adminPeriod}
      initialOjtPeriod={ojtPeriod}
      initialTab={initialTab}
      usingDatabase={false}
      employees={employees}
      constructionAttendance={[]}
      adminAttendance={[]}
      ojtAttendance={[]}
      payrollAdjustments={payrollAdjustments}
      disbursementMethods={disbursementMethods}
      otPayPercent={otPayPercent}
    />
  );
}
