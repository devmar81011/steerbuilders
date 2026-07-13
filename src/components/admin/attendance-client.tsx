"use client";

import { useMemo, useState, useTransition } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { Button } from "@/components/ui/button";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import {
  mergeAdminRowsWithPreview,
  mergeConstructionRowsWithPreview,
  saveAdminAttendanceRow,
  saveConstructionAttendanceRow,
} from "@/lib/attendance-preview-storage";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableEmpty,
  TablePrimaryCell,
  TableRow,
  TableShell,
} from "@/components/ui/table";
import {
  getAttendanceForWeek,
  updateAdminAttendanceTime,
  updateAttendanceDay,
} from "@/lib/actions/attendance";
import {
  ATTENDANCE_DAYS,
  calculateDayHours,
  countAdminHours,
  countPresentDays,
  formatHours,
  formatWeekRange,
  getWeekStart,
  isAdminDayPresent,
  setAdminDayTime,
  setDayValue,
  shiftWeekStart,
  type AdminAttendanceRow,
  type AdminTimeField,
  type AttendanceDayKey,
  type AttendanceRow,
  type AttendanceTab,
} from "@/lib/attendance";
import { sortRows, useTableSort } from "@/lib/table-sort";
import { TimePicker12h } from "@/components/ui/time-picker-12h";
import { formatTime12 } from "@/lib/time-format";

type Props = {
  initialConstructionRows: AttendanceRow[];
  initialAdminRows: AdminAttendanceRow[];
  initialOjtRows: AdminAttendanceRow[];
  initialWeekStart: string;
  usingDatabase: boolean;
};

type ConstructionSortKey = "name" | "present";
type HourlySortKey = "name" | "hours";

const tabs: { id: AttendanceTab; label: string; description: string }[] = [
  {
    id: "construction",
    label: "Construction",
    description: "Daily present / absent — daily rate, Sunday off by default.",
  },
  {
    id: "admin",
    label: "Admin",
    description: "Hourly time in / time out — all days start at 00:00 AM until set.",
  },
  {
    id: "ojt",
    label: "OJT",
    description: "Hourly trainees — time in / time out, all days start at 00:00 AM until set.",
  },
];

function AttendanceChip({
  present,
  onToggle,
  disabled,
}: {
  present: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`min-w-[72px] cursor-pointer rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40 disabled:cursor-not-allowed disabled:opacity-60 ${
        present
          ? "border-emerald-500/45 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          : "border-red-400/50 bg-red-50 text-red-600 hover:bg-red-100"
      }`}
      aria-pressed={present}
      aria-label={
        present ? "Present — click to mark absent" : "Absent — click to mark present"
      }
    >
      {present ? "Present" : "Absent"}
    </button>
  );
}

function AdminDayCell({
  entry,
  disabled,
  onTimeChange,
}: {
  entry: AdminAttendanceRow[AttendanceDayKey];
  disabled?: boolean;
  onTimeChange: (field: AdminTimeField, value: string) => void;
}) {
  const present = isAdminDayPresent(entry);
  const hours = calculateDayHours(entry);

  return (
    <div
      className={`mx-auto flex w-[148px] flex-col items-center gap-1 rounded-md border px-1.5 py-1.5 ${
        present
          ? "border-emerald-500/35 bg-emerald-50/60"
          : "border-red-300/40 bg-red-50/50"
      }`}
    >
      <TimePicker12h
        label="In"
        value={entry.timeIn}
        disabled={disabled}
        onChange={(value) => onTimeChange("timeIn", value)}
      />
      <TimePicker12h
        label="Out"
        value={entry.timeOut}
        disabled={disabled}
        onChange={(value) => onTimeChange("timeOut", value)}
      />
      <span
        className={`text-[9px] font-semibold uppercase tracking-[0.08em] ${
          present ? "text-emerald-700" : "text-red-500"
        }`}
      >
        {present ? `${formatTime12(entry.timeIn)} – ${formatTime12(entry.timeOut)}` : "Off"}
      </span>
      {present && (
        <span className="text-[9px] font-medium text-emerald-700">{formatHours(hours)}</span>
      )}
    </div>
  );
}

export function AttendanceClient({
  initialConstructionRows,
  initialAdminRows,
  initialOjtRows,
  initialWeekStart,
  usingDatabase,
}: Props) {
  const [activeTab, setActiveTab] = useState<AttendanceTab>("construction");
  const [weekStart, setWeekStart] = useState(initialWeekStart);
  const [constructionRows, setConstructionRows] = useState(() =>
    mergeConstructionRowsWithPreview(initialWeekStart, initialConstructionRows)
  );
  const [adminRows, setAdminRows] = useState(() =>
    mergeAdminRowsWithPreview(initialWeekStart, initialAdminRows)
  );
  const [ojtRows, setOjtRows] = useState(() =>
    mergeAdminRowsWithPreview(initialWeekStart, initialOjtRows)
  );
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [loadingWeek, setLoadingWeek] = useState(false);
  const { sort: constructionSort, toggleSort: toggleConstructionSort } =
    useTableSort<ConstructionSortKey>({ defaultKey: "name" });
  const { sort: adminSort, toggleSort: toggleAdminSort } =
    useTableSort<HourlySortKey>({ defaultKey: "name" });
  const { sort: ojtSort, toggleSort: toggleOjtSort } =
    useTableSort<HourlySortKey>({ defaultKey: "name" });

  const hourlyRows = activeTab === "admin" ? adminRows : ojtRows;
  const hourlySort = activeTab === "admin" ? adminSort : ojtSort;
  const toggleHourlySort = activeTab === "admin" ? toggleAdminSort : toggleOjtSort;
  const hourlyEmptyMessage =
    activeTab === "admin"
      ? "No active admin employees."
      : "No active OJT trainees.";


  const sortedConstructionRows = useMemo(
    () =>
      sortRows(constructionRows, constructionSort, (row, key) => {
        if (key === "present") return countPresentDays(row);
        return row.employeeName;
      }),
    [constructionRows, constructionSort]
  );

  const sortedHourlyRows = useMemo(
    () =>
      sortRows(hourlyRows, hourlySort, (row, key) => {
        if (key === "hours") return countAdminHours(row);
        return row.employeeName;
      }),
    [hourlyRows, hourlySort]
  );

  const activeTabMeta = tabs.find((tab) => tab.id === activeTab)!;

  function loadWeek(nextWeekStart: string) {
    setLoadingWeek(true);
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await getAttendanceForWeek(nextWeekStart);
        setWeekStart(nextWeekStart);
        setConstructionRows(
          mergeConstructionRowsWithPreview(nextWeekStart, result.constructionRows)
        );
        setAdminRows(mergeAdminRowsWithPreview(nextWeekStart, result.adminRows));
        setOjtRows(mergeAdminRowsWithPreview(nextWeekStart, result.ojtRows));
      } finally {
        setLoadingWeek(false);
      }
    });
  }

  function handleConstructionToggle(row: AttendanceRow, dayKey: AttendanceDayKey) {
    const nextPresent = !row[dayKey];
    const nextRow = setDayValue(row, dayKey, nextPresent);

    setConstructionRows((current) =>
      current.map((item) =>
        item.employeeId === row.employeeId ? nextRow : item
      )
    );
    saveConstructionAttendanceRow(nextRow);
    setMessage(null);

    startTransition(async () => {
      const result = await updateAttendanceDay(
        row.employeeId,
        weekStart,
        dayKey,
        nextPresent
      );
      if (result.error) {
        setConstructionRows((current) =>
          current.map((item) =>
            item.employeeId === row.employeeId ? row : item
          )
        );
        saveConstructionAttendanceRow(row);
        setMessage(result.error);
      }
    });
  }

  function handleHourlyTimeChange(
    row: AdminAttendanceRow,
    dayKey: AttendanceDayKey,
    field: AdminTimeField,
    value: string
  ) {
    const nextRow = setAdminDayTime(row, dayKey, field, value);
    const updateRows =
      activeTab === "admin" ? setAdminRows : setOjtRows;

    updateRows((current) =>
      current.map((item) =>
        item.employeeId === row.employeeId ? nextRow : item
      )
    );
    saveAdminAttendanceRow(nextRow);
    setMessage(null);

    startTransition(async () => {
      const result = await updateAdminAttendanceTime(
        row.employeeId,
        weekStart,
        dayKey,
        field,
        value
      );
      if (result.error) {
        updateRows((current) =>
          current.map((item) =>
            item.employeeId === row.employeeId ? row : item
          )
        );
        saveAdminAttendanceRow(row);
        setMessage(result.error);
      }
    });
  }

  const weekLabel = formatWeekRange(weekStart);
  const isBusy = pending || loadingWeek;

  return (
    <AdminShell>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-sbc-black">Attendance</h1>
          <p className="mt-1 text-sm text-sbc-gray">{activeTabMeta.description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isBusy}
            onClick={() => loadWeek(shiftWeekStart(weekStart, -1))}
          >
            ← Prev
          </Button>
          <span className="min-w-[160px] text-center text-sm font-medium text-sbc-black">
            {weekLabel}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isBusy}
            onClick={() => loadWeek(shiftWeekStart(weekStart, 1))}
          >
            Next →
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isBusy}
            onClick={() => loadWeek(getWeekStart())}
          >
            This Week
          </Button>
        </div>
      </div>

      <div className="mb-6 flex gap-1 border-b border-sbc-gray-light">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`cursor-pointer border-b-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] transition-colors ${
                active
                  ? "border-sbc-gold text-sbc-gold-dark"
                  : "border-transparent text-sbc-gray hover:border-sbc-gold/40 hover:text-sbc-gold-dark"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {message && (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {message}
        </p>
      )}

      {activeTab === "construction" ? (
        <TableShell minWidth="960px" scrollable>
          <Table>
            <TableHeader>
              <tr>
                <SortableTableHead
                  sortKey="name"
                  activeKey={constructionSort.key}
                  direction={constructionSort.direction}
                  onSort={(key) => toggleConstructionSort(key as ConstructionSortKey)}
                >
                  Employee
                </SortableTableHead>
                {ATTENDANCE_DAYS.map(({ key, label }) => (
                  <TableHead key={key} className="text-center">
                    {label}
                  </TableHead>
                ))}
                <SortableTableHead
                  sortKey="present"
                  activeKey={constructionSort.key}
                  direction={constructionSort.direction}
                  onSort={(key) => toggleConstructionSort(key as ConstructionSortKey)}
                  align="right"
                >
                  Days Present
                </SortableTableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {sortedConstructionRows.length === 0 ? (
                <TableEmpty
                  colSpan={ATTENDANCE_DAYS.length + 2}
                  message="No active construction employees."
                />
              ) : (
                sortedConstructionRows.map((row) => (
                  <TableRow key={row.employeeId}>
                    <TablePrimaryCell>{row.employeeName}</TablePrimaryCell>
                    {ATTENDANCE_DAYS.map(({ key }) => (
                      <TableCell key={key} className="text-center">
                        <AttendanceChip
                          present={row[key]}
                          disabled={isBusy}
                          onToggle={() => handleConstructionToggle(row, key)}
                        />
                      </TableCell>
                    ))}
                    <TableCell align="right" numeric className="!text-sbc-black">
                      {countPresentDays(row)} / 7
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableShell>
      ) : activeTab === "admin" || activeTab === "ojt" ? (
        <TableShell minWidth="1280px" scrollable>
          <Table>
            <TableHeader>
              <tr>
                <SortableTableHead
                  sortKey="name"
                  activeKey={hourlySort.key}
                  direction={hourlySort.direction}
                  onSort={(key) => toggleHourlySort(key as HourlySortKey)}
                >
                  Employee
                </SortableTableHead>
                {ATTENDANCE_DAYS.map(({ key, label }) => (
                  <TableHead key={key} className="text-center">
                    {label}
                  </TableHead>
                ))}
                <SortableTableHead
                  sortKey="hours"
                  activeKey={hourlySort.key}
                  direction={hourlySort.direction}
                  onSort={(key) => toggleHourlySort(key as HourlySortKey)}
                  align="right"
                >
                  Total Hours
                </SortableTableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {sortedHourlyRows.length === 0 ? (
                <TableEmpty
                  colSpan={ATTENDANCE_DAYS.length + 2}
                  message={hourlyEmptyMessage}
                />
              ) : (
                sortedHourlyRows.map((row) => (
                  <TableRow key={row.employeeId}>
                    <TablePrimaryCell>{row.employeeName}</TablePrimaryCell>
                    {ATTENDANCE_DAYS.map(({ key }) => (
                      <TableCell key={key} className="text-center">
                        <AdminDayCell
                          entry={row[key]}
                          disabled={isBusy}
                          onTimeChange={(field, value) =>
                            handleHourlyTimeChange(row, key, field, value)
                          }
                        />
                      </TableCell>
                    ))}
                    <TableCell align="right" numeric className="!text-sbc-black">
                      {formatHours(countAdminHours(row))}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableShell>
      ) : null}
    </AdminShell>
  );
}
