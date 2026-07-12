import { AttendanceClient } from "@/components/admin/attendance-client";
import { getAttendanceForWeek } from "@/lib/actions/attendance";
import { getWeekStart } from "@/lib/attendance";

export default async function AttendancePage() {
  const weekStart = getWeekStart();
  const { constructionRows, adminRows, ojtRows, usingDatabase } =
    await getAttendanceForWeek(weekStart);

  return (
    <AttendanceClient
      initialConstructionRows={constructionRows}
      initialAdminRows={adminRows}
      initialOjtRows={ojtRows}
      initialWeekStart={weekStart}
      usingDatabase={usingDatabase}
    />
  );
}
