"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  adminDayTimesFromRecord,
  adminRowToTimesRecord,
  createDefaultAdminAttendanceRow,
  createDefaultAttendanceRow,
  DEFAULT_ATTENDANCE,
  type AdminAttendanceRow,
  type AdminTimeField,
  type AttendanceDayKey,
  type AttendanceRow,
} from "@/lib/attendance";
import { getEmployees } from "@/lib/actions/payroll";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isPreviewEmployeeId } from "@/lib/preview-mode";
import { requireAdmin } from "@/lib/auth/require-admin";
import type {
  AdminAttendanceWeekRow,
  AttendanceWeekRow,
} from "@/lib/supabase/types";

function mapAttendanceRow(
  employeeName: string,
  row: AttendanceWeekRow
): AttendanceRow {
  return {
    id: row.id,
    employeeId: row.employee_id,
    employeeName,
    weekStart: row.week_start,
    sun: row.sun,
    mon: row.mon,
    tue: row.tue,
    wed: row.wed,
    thu: row.thu,
    fri: row.fri,
    sat: row.sat,
  };
}

function mapAdminAttendanceRow(
  employeeName: string,
  row: AdminAttendanceWeekRow
): AdminAttendanceRow {
  const times = adminDayTimesFromRecord(
    row.times as Partial<
      Record<AttendanceDayKey, { timeIn: string; timeOut: string }>
    >
  );

  return {
    id: row.id,
    employeeId: row.employee_id,
    employeeName,
    weekStart: row.week_start,
    ...times,
  };
}

export async function getConstructionAttendanceForWeek(
  weekStart: string
): Promise<{ rows: AttendanceRow[]; usingDatabase: boolean }> {
  const employees = (await getEmployees()).filter(
    (e) => e.status === "active" && e.category === "construction"
  );

  if (!isSupabaseConfigured()) {
    return {
      rows: employees.map((employee) =>
        createDefaultAttendanceRow(employee.id, employee.name, weekStart)
      ),
      usingDatabase: false,
    };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("attendance_weeks")
      .select("*")
      .eq("week_start", weekStart);

    if (error) {
      return {
        rows: employees.map((employee) =>
          createDefaultAttendanceRow(employee.id, employee.name, weekStart)
        ),
        usingDatabase: false,
      };
    }

    const byEmployee = new Map(
      (data as AttendanceWeekRow[]).map((row) => [row.employee_id, row])
    );

    return {
      rows: employees.map((employee) => {
        const existing = byEmployee.get(employee.id);
        if (existing) return mapAttendanceRow(employee.name, existing);
        return createDefaultAttendanceRow(
          employee.id,
          employee.name,
          weekStart
        );
      }),
      usingDatabase: true,
    };
  } catch {
    return {
      rows: employees.map((employee) =>
        createDefaultAttendanceRow(employee.id, employee.name, weekStart)
      ),
      usingDatabase: false,
    };
  }
}

export async function getHourlyAttendanceForWeek(
  weekStart: string,
  category: "admin" | "ojt"
): Promise<{ rows: AdminAttendanceRow[]; usingDatabase: boolean }> {
  const employees = (await getEmployees()).filter(
    (e) => e.status === "active" && e.category === category
  );

  if (!isSupabaseConfigured()) {
    return {
      rows: employees.map((employee) =>
        createDefaultAdminAttendanceRow(employee.id, employee.name, weekStart)
      ),
      usingDatabase: false,
    };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("admin_attendance_weeks")
      .select("*")
      .eq("week_start", weekStart);

    if (error) {
      return {
        rows: employees.map((employee) =>
          createDefaultAdminAttendanceRow(employee.id, employee.name, weekStart)
        ),
        usingDatabase: false,
      };
    }

    const employeeIds = new Set(employees.map((employee) => employee.id));
    const byEmployee = new Map(
      (data as AdminAttendanceWeekRow[])
        .filter((row) => employeeIds.has(row.employee_id))
        .map((row) => [row.employee_id, row])
    );

    return {
      rows: employees.map((employee) => {
        const existing = byEmployee.get(employee.id);
        if (existing) return mapAdminAttendanceRow(employee.name, existing);
        return createDefaultAdminAttendanceRow(
          employee.id,
          employee.name,
          weekStart
        );
      }),
      usingDatabase: true,
    };
  } catch {
    return {
      rows: employees.map((employee) =>
        createDefaultAdminAttendanceRow(employee.id, employee.name, weekStart)
      ),
      usingDatabase: false,
    };
  }
}

export async function getAdminAttendanceForWeek(weekStart: string) {
  return getHourlyAttendanceForWeek(weekStart, "admin");
}

export async function getOjtAttendanceForWeek(weekStart: string) {
  return getHourlyAttendanceForWeek(weekStart, "ojt");
}

export async function getAttendanceForWeek(weekStart: string) {
  const [construction, admin, ojt] = await Promise.all([
    getConstructionAttendanceForWeek(weekStart),
    getHourlyAttendanceForWeek(weekStart, "admin"),
    getHourlyAttendanceForWeek(weekStart, "ojt"),
  ]);

  return {
    constructionRows: construction.rows,
    adminRows: admin.rows,
    ojtRows: ojt.rows,
    usingDatabase:
      construction.usingDatabase && admin.usingDatabase && ojt.usingDatabase,
  };
}

export async function updateAttendanceDay(
  employeeId: string,
  weekStart: string,
  dayKey: AttendanceDayKey,
  hours: number,
  overtimeHours: number
): Promise<{ error?: string; success?: boolean; preview?: boolean }> {
  await requireAdmin();
  if (!isSupabaseConfigured() || isPreviewEmployeeId(employeeId)) {
    return { success: true, preview: true };
  }

  try {
    const supabase = await createClient();
    const { data: existing, error: fetchError } = await supabase
      .from("attendance_weeks")
      .select("*")
      .eq("employee_id", employeeId)
      .eq("week_start", weekStart)
      .maybeSingle();

    if (fetchError) return { error: fetchError.message };

    const nextDays = {
      ...DEFAULT_ATTENDANCE,
      ...(existing
        ? {
            sun: existing.sun,
            mon: existing.mon,
            tue: existing.tue,
            wed: existing.wed,
            thu: existing.thu,
            fri: existing.fri,
            sat: existing.sat,
          }
        : {}),
      [dayKey]: { hours, overtimeHours },
    };

    const payload = {
      employee_id: employeeId,
      week_start: weekStart,
      ...nextDays,
      updated_at: new Date().toISOString(),
    };

    const { error } = existing
      ? await supabase
          .from("attendance_weeks")
          .update(payload)
          .eq("id", existing.id)
      : await supabase.from("attendance_weeks").insert(payload);

    if (error) return { error: error.message };
  } catch {
    return { error: "Failed to save attendance." };
  }

  revalidatePath("/admin/attendance");
  revalidatePath("/admin/payroll");
  return { success: true };
}

export async function updateAdminAttendanceTime(
  employeeId: string,
  weekStart: string,
  dayKey: AttendanceDayKey,
  field: AdminTimeField,
  value: string
): Promise<{ error?: string; success?: boolean; preview?: boolean }> {
  await requireAdmin();
  if (!isSupabaseConfigured() || isPreviewEmployeeId(employeeId)) {
    return { success: true, preview: true };
  }

  try {
    const supabase = await createClient();
    const { data: existing, error: fetchError } = await supabase
      .from("admin_attendance_weeks")
      .select("*")
      .eq("employee_id", employeeId)
      .eq("week_start", weekStart)
      .maybeSingle();

    if (fetchError) return { error: fetchError.message };

    const currentTimes = adminDayTimesFromRecord(
      (existing?.times as Partial<
        Record<AttendanceDayKey, { timeIn: string; timeOut: string }>
      >) ?? null
    );

    const nextTimes = {
      ...currentTimes,
      [dayKey]: { ...currentTimes[dayKey], [field]: value },
    };

    const payload = {
      employee_id: employeeId,
      week_start: weekStart,
      times: nextTimes,
      updated_at: new Date().toISOString(),
    };

    const { error } = existing
      ? await supabase
          .from("admin_attendance_weeks")
          .update(payload)
          .eq("id", existing.id)
      : await supabase.from("admin_attendance_weeks").insert(payload);

    if (error) return { error: error.message };
  } catch {
    return { error: "Failed to save admin attendance." };
  }

  revalidatePath("/admin/attendance");
  revalidatePath("/admin/payroll");
  return { success: true };
}

export async function saveAdminAttendanceRow(
  row: AdminAttendanceRow
): Promise<{ error?: string; success?: boolean }> {
  await requireAdmin();
  if (!isSupabaseConfigured()) {
    return { error: "Database is not configured." };
  }

  try {
    const supabase = await createClient();
    const payload = {
      employee_id: row.employeeId,
      week_start: row.weekStart,
      times: adminRowToTimesRecord(row),
      updated_at: new Date().toISOString(),
    };

    const { error } = row.id
      ? await supabase
          .from("admin_attendance_weeks")
          .update(payload)
          .eq("id", row.id)
      : await supabase.from("admin_attendance_weeks").insert(payload);

    if (error) return { error: error.message };
  } catch {
    return { error: "Failed to save admin attendance." };
  }

  revalidatePath("/admin/attendance");
  return { success: true };
}
