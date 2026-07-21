"use client";

import { memo, useCallback, useMemo, useState, useTransition } from "react";
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
type TableSortState<K extends string> = {
  key: K | null;
  direction: "asc" | "desc";
};

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

const ConstructionDayCell = memo(function ConstructionDayCell({
  entry,
  disabled,
  onHoursChange,
}: {
  entry: { hours: number; overtimeHours: number };
  disabled?: boolean;
  onHoursChange: (hours: number, overtimeHours: number) => void;
}) {
  return (
    <div className="flex w-[76px] flex-col items-start gap-1">
      <input
        type="number"
        min="0"
        max="24"
        step="0.5"
        value={entry.hours}
        disabled={disabled}
        onChange={(e) => onHoursChange(Number(e.target.value) || 0, entry.overtimeHours)}
        className="w-full rounded border border-sbc-gray-light px-1 py-0.5 text-left text-[11px] focus:border-sbc-gold focus:outline-none focus:ring-1 focus:ring-sbc-gold/40 disabled:opacity-60"
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
        className="w-full rounded border border-sbc-gray-light px-1 py-0.5 text-left text-[11px] focus:border-sbc-gold focus:outline-none focus:ring-1 focus:ring-sbc-gold/40 disabled:opacity-60"
        placeholder="OT"
        title="OT hours"
        aria-label="OT hours"
      />
    </div>
  );
});

const AdminDayCell = memo(function AdminDayCell({
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
      className={`flex w-full max-w-[120px] flex-col items-start gap-0.5 rounded-md border px-0.5 py-1 ${
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
});

const ConstructionAttendancePanel = memo(function ConstructionAttendancePanel({
  rows,
  sort,
  onToggleSort,
  employeeSites,
  siteFilter,
  cellsBusy,
  onHoursChange,
}: {
  rows: AttendanceRow[];
  sort: TableSortState<ConstructionSortKey>;
  onToggleSort: (key: ConstructionSortKey) => void;
  employeeSites: Record<string, string>;
  siteFilter: string;
  cellsBusy: boolean;
  onHoursChange: (
    row: AttendanceRow,
    dayKey: AttendanceDayKey,
    hours: number,
    overtimeHours: number
  ) => void;
}) {
  return (
    <TableShell minWidth="0" scrollable>
      <Table className="table-fixed">
        <TableHeader>
          <tr>
            <SortableTableHead
              sortKey="name"
              activeKey={sort.key}
              direction={sort.direction}
              onSort={(key) => onToggleSort(key as ConstructionSortKey)}
              className="!w-[11%] !px-2"
            >
              Employee
            </SortableTableHead>
            <SortableTableHead
              sortKey="site"
              activeKey={sort.key}
              direction={sort.direction}
              onSort={(key) => onToggleSort(key as ConstructionSortKey)}
              className="!w-[7%] !px-1"
            >
              Site
            </SortableTableHead>
            {ATTENDANCE_DAYS.map(({ key, label }) => (
              <TableHead key={key} className="!w-[10%] !px-1 text-left">
                {label}
              </TableHead>
            ))}
            <SortableTableHead
              sortKey="present"
              activeKey={sort.key}
              direction={sort.direction}
              onSort={(key) => onToggleSort(key as ConstructionSortKey)}
              className="!w-[6%] !px-1"
            >
              Total Hrs
            </SortableTableHead>
            <TableHead className="!w-[6%] !px-1">Total OT</TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableEmpty
              colSpan={ATTENDANCE_DAYS.length + 4}
              message={
                siteFilter === "all"
                  ? "No active construction employees."
                  : `No construction employees for ${siteFilter}.`
              }
            />
          ) : (
            rows.map((row) => (
              <TableRow key={row.employeeId}>
                <TablePrimaryCell>{row.employeeName}</TablePrimaryCell>
                <TableCell className="!px-1 !text-sbc-gray">
                  {employeeSites[row.employeeId] || "Unassigned"}
                </TableCell>
                {ATTENDANCE_DAYS.map(({ key }) => (
                  <TableCell key={key} className="!px-1 text-left">
                    <ConstructionDayCell
                      entry={row[key]}
                      disabled={cellsBusy}
                      onHoursChange={(hours, overtimeHours) =>
                        onHoursChange(row, key, hours, overtimeHours)
                      }
                    />
                  </TableCell>
                ))}
                <TableCell numeric className="!px-1 !text-sbc-black">
                  {formatHours(countTotalHours(row))}
                </TableCell>
                <TableCell numeric className="!px-1 !text-sbc-black">
                  {formatHours(countTotalOvertimeHours(row))}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableShell>
  );
});

const HourlyAttendancePanel = memo(function HourlyAttendancePanel({
  rows,
  sort,
  onToggleSort,
  employeeSites,
  siteFilter,
  cellsBusy,
  emptyAllMessage,
  emptyFilteredMessage,
  onTimeChange,
}: {
  rows: AdminAttendanceRow[];
  sort: TableSortState<HourlySortKey>;
  onToggleSort: (key: HourlySortKey) => void;
  employeeSites: Record<string, string>;
  siteFilter: string;
  cellsBusy: boolean;
  emptyAllMessage: string;
  emptyFilteredMessage: string;
  onTimeChange: (
    row: AdminAttendanceRow,
    dayKey: AttendanceDayKey,
    field: AdminTimeField,
    value: string
  ) => void;
}) {
  return (
    <TableShell minWidth="0" scrollable>
      <Table className="table-fixed">
        <TableHeader>
          <tr>
            <SortableTableHead
              sortKey="name"
              activeKey={sort.key}
              direction={sort.direction}
              onSort={(key) => onToggleSort(key as HourlySortKey)}
              className="!w-[11%] !px-2"
            >
              Employee
            </SortableTableHead>
            <SortableTableHead
              sortKey="site"
              activeKey={sort.key}
              direction={sort.direction}
              onSort={(key) => onToggleSort(key as HourlySortKey)}
              className="!w-[7%] !px-1"
            >
              Site
            </SortableTableHead>
            {ATTENDANCE_DAYS.map(({ key, label }) => (
              <TableHead key={key} className="!w-[11%] !px-1 text-left">
                {label}
              </TableHead>
            ))}
            <SortableTableHead
              sortKey="hours"
              activeKey={sort.key}
              direction={sort.direction}
              onSort={(key) => onToggleSort(key as HourlySortKey)}
              className="!w-[5%] !px-1"
            >
              Total Hours
            </SortableTableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableEmpty
              colSpan={ATTENDANCE_DAYS.length + 3}
              message={
                siteFilter === "all" ? emptyAllMessage : emptyFilteredMessage
              }
            />
          ) : (
            rows.map((row) => (
              <TableRow key={row.employeeId}>
                <TablePrimaryCell>{row.employeeName}</TablePrimaryCell>
                <TableCell className="!px-1 !text-sbc-gray">
                  {employeeSites[row.employeeId] || "Unassigned"}
                </TableCell>
                {ATTENDANCE_DAYS.map(({ key }) => (
                  <TableCell key={key} className="!px-1 text-left">
                    <AdminDayCell
                      entry={row[key]}
                      disabled={cellsBusy}
                      onTimeChange={(field, value) =>
                        onTimeChange(row, key, field, value)
                      }
                    />
                  </TableCell>
                ))}
                <TableCell numeric className="!px-1 !text-sbc-black">
                  {formatHours(countAdminHours(row))}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableShell>
  );
});

export function AttendanceClient({
  initialConstructionRows,
  initialAdminRows,
  initialOjtRows,
  initialWeekStart,
  employeeSites,
}: Props) {
  const [activeTab, setActiveTab] = useState<AttendanceTab>("construction");
  const [mountedTabs, setMountedTabs] = useState<Set<AttendanceTab>>(
    () => new Set<AttendanceTab>(["construction"])
  );
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

  const sortedAdminRows = useMemo(
    () =>
      sortRows(
        adminRows.filter((row) => matchesSiteFilter(row.employeeId)),
        adminSort,
        (row, key) => {
          if (key === "hours") return countAdminHours(row);
          if (key === "site") return employeeSites[row.employeeId] || "Unassigned";
          return row.employeeName;
        }
      ),
    [adminRows, adminSort, siteFilter, employeeSites]
  );

  const sortedOjtRows = useMemo(
    () =>
      sortRows(
        ojtRows.filter((row) => matchesSiteFilter(row.employeeId)),
        ojtSort,
        (row, key) => {
          if (key === "hours") return countAdminHours(row);
          if (key === "site") return employeeSites[row.employeeId] || "Unassigned";
          return row.employeeName;
        }
      ),
    [ojtRows, ojtSort, siteFilter, employeeSites]
  );

  const activeTabMeta = tabs.find((tab) => tab.id === activeTab)!;
  const weekNavBusy = loadingWeek;

  const selectTab = useCallback(
    (tabId: AttendanceTab) => {
      setActiveTab(tabId);
      startTransition(() => {
        setMountedTabs((current) => {
          if (current.has(tabId)) return current;
          const next = new Set(current);
          next.add(tabId);
          return next;
        });
      });
    },
    [startTransition]
  );

  const onConstructionToggleSort = useCallback(
    (key: ConstructionSortKey) => toggleConstructionSort(key),
    [toggleConstructionSort]
  );
  const onAdminToggleSort = useCallback(
    (key: HourlySortKey) => toggleAdminSort(key),
    [toggleAdminSort]
  );
  const onOjtToggleSort = useCallback(
    (key: HourlySortKey) => toggleOjtSort(key),
    [toggleOjtSort]
  );

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

  const handleConstructionToggle = useCallback(
    (
      row: AttendanceRow,
      dayKey: AttendanceDayKey,
      hours: number,
      overtimeHours: number
    ) => {
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
    },
    [weekStart, startTransition]
  );

  const handleAdminTimeChange = useCallback(
    (
      row: AdminAttendanceRow,
      dayKey: AttendanceDayKey,
      field: AdminTimeField,
      value: string
    ) => {
      const nextRow = setAdminDayTime(row, dayKey, field, value);

      setAdminRows((current) =>
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
          setAdminRows((current) =>
            current.map((item) =>
              item.employeeId === row.employeeId ? row : item
            )
          );
          saveAdminAttendanceRow(row);
          setMessage(result.error);
        }
      });
    },
    [weekStart, startTransition]
  );

  const handleOjtTimeChange = useCallback(
    (
      row: AdminAttendanceRow,
      dayKey: AttendanceDayKey,
      field: AdminTimeField,
      value: string
    ) => {
      const nextRow = setAdminDayTime(row, dayKey, field, value);

      setOjtRows((current) =>
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
          setOjtRows((current) =>
            current.map((item) =>
              item.employeeId === row.employeeId ? row : item
            )
          );
          saveAdminAttendanceRow(row);
          setMessage(result.error);
        }
      });
    },
    [weekStart, startTransition]
  );

  const weekLabel = formatWeekRange(weekStart);
  const cellsBusy = pending || loadingWeek;

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
            disabled={weekNavBusy}
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
            disabled={weekNavBusy}
            onClick={() => loadWeek(shiftWeekStart(weekStart, 1))}
          >
            Next →
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={weekNavBusy}
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
              onClick={() => selectTab(tab.id)}
              className={`cursor-pointer border-b-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] ${
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

      {mountedTabs.has("construction") && (
        <div hidden={activeTab !== "construction"}>
          <ConstructionAttendancePanel
            rows={sortedConstructionRows}
            sort={constructionSort}
            onToggleSort={onConstructionToggleSort}
            employeeSites={employeeSites}
            siteFilter={siteFilter}
            cellsBusy={cellsBusy}
            onHoursChange={handleConstructionToggle}
          />
        </div>
      )}

      {mountedTabs.has("admin") && (
        <div hidden={activeTab !== "admin"}>
          <HourlyAttendancePanel
            rows={sortedAdminRows}
            sort={adminSort}
            onToggleSort={onAdminToggleSort}
            employeeSites={employeeSites}
            siteFilter={siteFilter}
            cellsBusy={cellsBusy}
            emptyAllMessage="No active admin employees."
            emptyFilteredMessage={`No admin employees for ${siteFilter}.`}
            onTimeChange={handleAdminTimeChange}
          />
        </div>
      )}

      {mountedTabs.has("ojt") && (
        <div hidden={activeTab !== "ojt"}>
          <HourlyAttendancePanel
            rows={sortedOjtRows}
            sort={ojtSort}
            onToggleSort={onOjtToggleSort}
            employeeSites={employeeSites}
            siteFilter={siteFilter}
            cellsBusy={cellsBusy}
            emptyAllMessage="No active OJT trainees."
            emptyFilteredMessage={`No ojt employees for ${siteFilter}.`}
            onTimeChange={handleOjtTimeChange}
          />
        </div>
      )}
    </>
  );
}
