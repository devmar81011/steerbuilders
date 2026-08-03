import { AttendanceClient } from "@/components/admin/attendance-client";
import { getAttendanceForWeek } from "@/lib/actions/attendance";
import { getEmployees } from "@/lib/actions/payroll";
import { getWeekStart } from "@/lib/attendance";

export default async function AttendancePage() {
  const weekStart = getWeekStart();
  const [{ constructionRows, usingDatabase }, employees] = await Promise.all([
    getAttendanceForWeek(weekStart),
    getEmployees(),
  ]);

  const employeeSites = Object.fromEntries(
    employees.map((employee) => [
      employee.id,
      employee.assignedSite?.trim() || "Unassigned",
    ])
  );

  return (
    <AttendanceClient
      initialConstructionRows={constructionRows}
      initialWeekStart={weekStart}
      usingDatabase={usingDatabase}
      employeeSites={employeeSites}
    />
  );
}
