"use client";

import { useMemo, useState, useTransition } from "react";
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
  countTotalHours,
  countTotalOvertimeHours,
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
import { Select } from "@/components/ui/select";

type Props = {
  initialConstructionRows: AttendanceRow[];
  initialAdminRows: AdminAttendanceRow[];
  initialOjtRows: AdminAttendanceRow[];
  initialWeekStart: string;
  usingDatabase: boolean;
  employeeSites: Record<string, string>;
};

type ConstructionSortKey = "name" | "site" | "present";
type HourlySortKey = "name" | "site" | "hours";

const tabs: { id: AttendanceTab; label: string; description: string }[] = [
  {
    id: "construction",
    label: "Construction",
    description: "Daily hours and overtime input — regular hours + OT per day.",
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

function ConstructionDayCell({
  entry,
  disabled,
  onHoursChange,
}: {
  entry: { hours: number; overtimeHours: number };
  disabled?: boolean;
  onHoursChange: (hours: number, overtimeHours: number) => void;
}) {
  return (
    <div className="mx-auto flex w-[76px] flex-col items-center gap-1">
      <input
        type="number"
        min="0"
        max="24"
        step="0.5"
        value={entry.hours}
        disabled={disabled}
        onChange={(e) => onHoursChange(Number(e.target.value) || 0, entry.overtimeHours)}
        className="w-full rounded border border-sbc-gray-light px-1 py-0.5 text-center text-[11px] focus:border-sbc-gold focus:outline-none focus:ring-1 focus:ring-sbc-gold/40 disabled:opacity-60"
        placeholder="Hrs"
        title="Regular hours"
        aria-label="Regular hours"
      />
      <input
        type="number"
        min="0"
        max="24"
        step="0.5"
        value={entry.overtimeHours}
        disabled={disabled}
        onChange={(e) => onHoursChange(entry.hours, Number(e.target.value) || 0)}
        className="w-full rounded border border-sbc-gray-light px-1 py-0.5 text-center text-[11px] focus:border-sbc-gold focus:outline-none focus:ring-1 focus:ring-sbc-gold/40 disabled:opacity-60"
        placeholder="OT"
        title="OT hours"
        aria-label="OT hours"
      />
    </div>
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
      className={`mx-auto flex w-full max-w-[120px] flex-col items-center gap-0.5 rounded-md border px-0.5 py-1 ${
        present
          ? "border-sbc-gold/35 bg-sbc-gold/5"
          : "border-sbc-gray-light bg-sbc-gray-light/40"
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
          present ? "text-sbc-gold-dark" : "text-sbc-gray"
        }`}
      >
        {present ? formatHours(hours) : "Off"}
      </span>
    </div>
  );
}

export function AttendanceClient({
  initialConstructionRows,
  initialAdminRows,
  initialOjtRows,
  initialWeekStart,
  usingDatabase,
  employeeSites,
}: Props) {
  const [activeTab, setActiveTab] = useState<AttendanceTab>("construction");
  const [weekStart, setWeekStart] = useState(initialWeekStart);
  const [siteFilter, setSiteFilter] = useState<string>("all");
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

  const siteOptions = useMemo(() => {
    const names = new Set(Object.values(employeeSites));
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [employeeSites]);

  function matchesSiteFilter(employeeId: string) {
    if (siteFilter === "all") return true;
    return (employeeSites[employeeId] || "Unassigned") === siteFilter;
  }

  const sortedConstructionRows = useMemo(
    () =>
      sortRows(
        constructionRows.filter((row) => matchesSiteFilter(row.employeeId)),
        constructionSort,
        (row, key) => {
          if (key === "present") return countTotalHours(row);
          if (key === "site") return employeeSites[row.employeeId] || "Unassigned";
          return row.employeeName;
        }
      ),
    [constructionRows, constructionSort, siteFilter, employeeSites]
  );

  const sortedHourlyRows = useMemo(
    () =>
      sortRows(
        hourlyRows.filter((row) => matchesSiteFilter(row.employeeId)),
        hourlySort,
        (row, key) => {
          if (key === "hours") return countAdminHours(row);
          if (key === "site") return employeeSites[row.employeeId] || "Unassigned";
          return row.employeeName;
        }
      ),
    [hourlyRows, hourlySort, siteFilter, employeeSites]
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

  function handleConstructionToggle(row: AttendanceRow, dayKey: AttendanceDayKey, hours: number, overtimeHours: number) {
    const nextRow = setDayValue(row, dayKey, hours, overtimeHours);

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
        hours,
        overtimeHours
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
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-sbc-black">Attendance</h1>
          <p className="mt-1 text-sm text-sbc-gray">{activeTabMeta.description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="min-w-[180px]">
            <Select
              label="Site"
              size="sm"
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
            >
              <option value="all">All sites</option>
              {siteOptions.map((site) => (
                <option key={site} value={site}>
                  {site}
                </option>
              ))}
            </Select>
          </div>
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
        <TableShell minWidth="0" scrollable>
          <Table className="table-fixed">
            <TableHeader>
              <tr>
                <SortableTableHead
                  sortKey="name"
                  activeKey={constructionSort.key}
                  direction={constructionSort.direction}
                  onSort={(key) => toggleConstructionSort(key as ConstructionSortKey)}
                  className="!w-[11%] !px-2"
                >
                  Employee
                </SortableTableHead>
                <SortableTableHead
                  sortKey="site"
                  activeKey={constructionSort.key}
                  direction={constructionSort.direction}
                  onSort={(key) => toggleConstructionSort(key as ConstructionSortKey)}
                  className="!w-[7%] !px-1"
                >
                  Site
                </SortableTableHead>
                {ATTENDANCE_DAYS.map(({ key, label }) => (
                  <TableHead key={key} className="!w-[10%] !px-1 text-center">
                    {label}
                  </TableHead>
                ))}
                <SortableTableHead
                  sortKey="present"
                  activeKey={constructionSort.key}
                  direction={constructionSort.direction}
                  onSort={(key) => toggleConstructionSort(key as ConstructionSortKey)}
                  align="right"
                  className="!w-[6%] !px-1"
                >
                  Total Hrs
                </SortableTableHead>
                <TableHead align="right" className="!w-[6%] !px-1">
                  Total OT
                </TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {sortedConstructionRows.length === 0 ? (
                <TableEmpty
                  colSpan={ATTENDANCE_DAYS.length + 4}
                  message={
                    siteFilter === "all"
                      ? "No active construction employees."
                      : `No construction employees for ${siteFilter}.`
                  }
                />
              ) : (
                sortedConstructionRows.map((row) => (
                  <TableRow key={row.employeeId}>
                    <TablePrimaryCell>{row.employeeName}</TablePrimaryCell>
                    <TableCell className="!px-1 !text-sbc-gray">
                      {employeeSites[row.employeeId] || "Unassigned"}
                    </TableCell>
                    {ATTENDANCE_DAYS.map(({ key }) => (
                      <TableCell key={key} className="!px-1 text-center">
                        <ConstructionDayCell
                          entry={row[key]}
                          disabled={isBusy}
                          onHoursChange={(hours, overtimeHours) =>
                            handleConstructionToggle(row, key, hours, overtimeHours)
                          }
                        />
                      </TableCell>
                    ))}
                    <TableCell align="right" numeric className="!px-1 !text-sbc-black">
                      {formatHours(countTotalHours(row))}
                    </TableCell>
                    <TableCell align="right" numeric className="!px-1 !text-sbc-black">
                      {formatHours(countTotalOvertimeHours(row))}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableShell>
      ) : activeTab === "admin" || activeTab === "ojt" ? (
        <TableShell minWidth="0" scrollable>
          <Table className="table-fixed">
            <TableHeader>
              <tr>
                <SortableTableHead
                  sortKey="name"
                  activeKey={hourlySort.key}
                  direction={hourlySort.direction}
                  onSort={(key) => toggleHourlySort(key as HourlySortKey)}
                  className="!w-[11%] !px-2"
                >
                  Employee
                </SortableTableHead>
                <SortableTableHead
                  sortKey="site"
                  activeKey={hourlySort.key}
                  direction={hourlySort.direction}
                  onSort={(key) => toggleHourlySort(key as HourlySortKey)}
                  className="!w-[7%] !px-1"
                >
                  Site
                </SortableTableHead>
                {ATTENDANCE_DAYS.map(({ key, label }) => (
                  <TableHead key={key} className="!w-[11%] !px-1 text-center">
                    {label}
                  </TableHead>
                ))}
                <SortableTableHead
                  sortKey="hours"
                  activeKey={hourlySort.key}
                  direction={hourlySort.direction}
                  onSort={(key) => toggleHourlySort(key as HourlySortKey)}
                  align="right"
                  className="!w-[5%] !px-1"
                >
                  Total Hours
                </SortableTableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {sortedHourlyRows.length === 0 ? (
                <TableEmpty
                  colSpan={ATTENDANCE_DAYS.length + 3}
                  message={
                    siteFilter === "all"
                      ? hourlyEmptyMessage
                      : `No ${activeTab} employees for ${siteFilter}.`
                  }
                />
              ) : (
                sortedHourlyRows.map((row) => (
                  <TableRow key={row.employeeId}>
                    <TablePrimaryCell>{row.employeeName}</TablePrimaryCell>
                    <TableCell className="!px-1 !text-sbc-gray">
                      {employeeSites[row.employeeId] || "Unassigned"}
                    </TableCell>
                    {ATTENDANCE_DAYS.map(({ key }) => (
                      <TableCell key={key} className="!px-1 text-center">
                        <AdminDayCell
                          entry={row[key]}
                          disabled={isBusy}
                          onTimeChange={(field, value) =>
                            handleHourlyTimeChange(row, key, field, value)
                          }
                        />
                      </TableCell>
                    ))}
                    <TableCell align="right" numeric className="!px-1 !text-sbc-black">
                      {formatHours(countAdminHours(row))}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableShell>
      ) : null}
    </>
  );
}
