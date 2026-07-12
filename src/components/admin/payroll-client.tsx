"use client";

import { useMemo, useState, useTransition } from "react";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import { sortRows, useTableSort } from "@/lib/table-sort";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  TableEditButton,
  TableProcessButton,
  TableRowActions,
} from "@/components/admin/table-row-actions";
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
  TableMeta,
} from "@/components/ui/table";
import { getPayrollForPeriod, updatePayrollEntry } from "@/lib/actions/payroll";
import { formatCurrency, type Employee, type PayrollEntry } from "@/lib/mvp-data";
import type { DailyRate } from "@/lib/daily-rates";
import type { AdminAttendanceRow, AttendanceRow } from "@/lib/attendance";
import type { PayrollAdjustment } from "@/lib/payroll-adjustments";
import {
  buildDeductionBreakdown,
  getDeductionAmount,
  resolveEntryDeductionBreakdown,
  sumDeductionLines,
  type DeductionLine,
} from "@/lib/deduction-lines";
import type { EmployeeDeductionContext } from "@/lib/deduction-role-rates";
import {
  mergeAdminRowsWithPreview,
  mergeConstructionRowsWithPreview,
} from "@/lib/attendance-preview-storage";
import {
  mergePayrollEntriesWithPreview,
  savePayrollEntryPreview,
} from "@/lib/payroll-preview-storage";
import {
  applyAttendanceToPayrollEntries,
  getWeekStartsForPayrollPeriod,
} from "@/lib/payroll-from-attendance";
import {
  getCurrentPayrollPeriod,
  payrollTabMeta,
  shiftPayrollPeriod,
  type PayrollPeriod,
  type PayrollTab,
} from "@/lib/payroll-periods";
import { usesWeeklyPayroll } from "@/lib/employee-categories";

type Props = {
  initialConstructionEntries: PayrollEntry[];
  initialAdminEntries: PayrollEntry[];
  initialOjtEntries: PayrollEntry[];
  initialConstructionPeriod: PayrollPeriod;
  initialAdminPeriod: PayrollPeriod;
  initialOjtPeriod: PayrollPeriod;
  usingDatabase: boolean;
  employees: Employee[];
  dailyRates: DailyRate[];
  constructionAttendance: AttendanceRow[];
  adminAttendance: AdminAttendanceRow[];
  ojtAttendance: AdminAttendanceRow[];
  payrollAdjustments: PayrollAdjustment[];
};

type PayrollForm = {
  hours: string;
  grossPay: string;
  deductionLines: Record<string, string>;
  status: "draft" | "processed";
};

function buildFormDeductionLines(
  grossPay: string,
  rules: PayrollAdjustment[],
  employee?: EmployeeDeductionContext
): Record<string, string> {
  const breakdown = buildDeductionBreakdown(Number(grossPay) || 0, rules, employee);
  return Object.fromEntries(
    breakdown.map((line) => [line.code, String(line.amount)])
  );
}

function employeeContextFromEntry(
  entry: PayrollEntry,
  employees: Employee[]
): EmployeeDeductionContext | undefined {
  const employee = employees.find((item) => item.id === entry.employeeId);
  if (!employee) return undefined;
  return { category: employee.category, role: employee.role };
}

function breakdownFromForm(
  form: PayrollForm,
  rules: PayrollAdjustment[]
): DeductionLine[] {
  return rules
    .filter((rule) => rule.active)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((rule) => ({
      code: rule.code,
      label: rule.label,
      amount: Number(form.deductionLines[rule.code]) || 0,
    }));
}

type PayrollSortKey =
  | "employeeName"
  | "hours"
  | "grossPay"
  | "deductions"
  | "netPay"
  | "status";

const tabs: { id: PayrollTab; label: string }[] = [
  { id: "construction", label: "Construction" },
  { id: "admin", label: "Admin" },
  { id: "ojt", label: "OJT" },
];

function chunkEntries(entries: PayrollEntry[], size: number): PayrollEntry[][] {
  const chunks: PayrollEntry[][] = [];
  for (let index = 0; index < entries.length; index += size) {
    chunks.push(entries.slice(index, index + size));
  }
  return chunks;
}

function applyPreviewAttendanceToPayroll(
  entries: PayrollEntry[],
  employees: Employee[],
  dailyRates: DailyRate[],
  constructionAttendance: AttendanceRow[],
  hourlyAttendance: AdminAttendanceRow[],
  category: PayrollTab,
  period: PayrollPeriod,
  payrollAdjustments: PayrollAdjustment[]
): PayrollEntry[] {
  let computed: PayrollEntry[];

  if (category === "construction") {
    const merged = mergeConstructionRowsWithPreview(
      period.periodStart,
      constructionAttendance
    );
    computed = applyAttendanceToPayrollEntries(
      entries,
      employees,
      dailyRates,
      merged,
      [],
      category,
      payrollAdjustments
    );
  } else {
    const weekStarts = getWeekStartsForPayrollPeriod(category, period);
    const mergedHourly = weekStarts.flatMap((weekStart) => {
      const weekRows = hourlyAttendance.filter((row) => row.weekStart === weekStart);
      return mergeAdminRowsWithPreview(weekStart, weekRows);
    });

    computed = applyAttendanceToPayrollEntries(
      entries,
      employees,
      dailyRates,
      [],
      mergedHourly,
      category,
      payrollAdjustments
    );
  }

  return mergePayrollEntriesWithPreview(computed);
}

function PayrollPrintSheet({
  entries,
  category,
  period,
  payrollAdjustments,
  employees,
}: {
  entries: PayrollEntry[];
  category: PayrollTab;
  period: PayrollPeriod;
  payrollAdjustments: PayrollAdjustment[];
  employees: Employee[];
}) {
  const quantityLabel = category === "construction" ? "Days worked" : "Hours";
  const pages = chunkEntries(entries, 6);
  const activeModules = payrollAdjustments
    .filter((rule) => rule.active)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="payroll-print-area">
      {pages.map((pageEntries, pageIndex) => (
        <section className="payroll-print-page" key={`${period.key}-${pageIndex}`}>
          <div className="payroll-print-page-header">
            <div>
              <p className="payroll-print-eyebrow">Steer Builders Corporation</p>
              <h2>Payroll Slips</h2>
            </div>
            <div className="payroll-print-meta">
              <p>{payrollTabMeta[category].label}</p>
              <p>{period.label}</p>
            </div>
          </div>

          <div className="payroll-print-grid">
            {pageEntries.map((entry) => {
              const employeeContext = employeeContextFromEntry(entry, employees);
              const breakdown = resolveEntryDeductionBreakdown(
                entry,
                payrollAdjustments,
                employeeContext
              );

              return (
              <article className="payroll-print-card" key={entry.id}>
                <div className="payroll-print-card-header">
                  <div>
                    <p className="payroll-print-eyebrow">Payroll Slip</p>
                    <h3>{entry.employeeName}</h3>
                  </div>
                  <span>{entry.status}</span>
                </div>

                <dl className="payroll-print-lines">
                  <div>
                    <dt>Period</dt>
                    <dd>{period.label}</dd>
                  </div>
                  <div>
                    <dt>{quantityLabel}</dt>
                    <dd>
                      {entry.hours}
                      {category === "construction" ? " day(s)" : " hour(s)"}
                    </dd>
                  </div>
                  <div>
                    <dt>Gross Pay</dt>
                    <dd>{formatCurrency(entry.grossPay)}</dd>
                  </div>
                  {activeModules.map((rule) => (
                    <div key={rule.code}>
                      <dt>{rule.label}</dt>
                      <dd>
                        {formatCurrency(getDeductionAmount(breakdown, rule.code))}
                      </dd>
                    </div>
                  ))}
                  <div>
                    <dt>Total Deductions</dt>
                    <dd>{formatCurrency(entry.deductions)}</dd>
                  </div>
                  <div className="payroll-print-net">
                    <dt>Net Pay</dt>
                    <dd>{formatCurrency(entry.netPay)}</dd>
                  </div>
                </dl>

                <div className="payroll-print-signatures">
                  <span>Received by</span>
                  <span>Prepared by</span>
                </div>
              </article>
            );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function PayrollTable({
  entries,
  category,
  period,
  payrollAdjustments,
  employees,
  editingId,
  form,
  pending,
  pendingId,
  sort,
  onToggleSort,
  onStartEdit,
  onProcess,
}: {
  entries: PayrollEntry[];
  category: PayrollTab;
  period: PayrollPeriod;
  payrollAdjustments: PayrollAdjustment[];
  employees: Employee[];
  editingId: string | null;
  form: PayrollForm;
  pending: boolean;
  pendingId: string | null;
  sort: ReturnType<typeof useTableSort<PayrollSortKey>>["sort"];
  onToggleSort: (key: PayrollSortKey) => void;
  onStartEdit: (entry: PayrollEntry) => void;
  onProcess: (id: string) => void;
}) {
  const quantityLabel = category === "construction" ? "Days Worked" : "Hours";
  const activeModules = payrollAdjustments
    .filter((rule) => rule.active)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const columnCount = 6 + activeModules.length;
  const sortedEntries = useMemo(
    () => sortRows(entries, sort, (row, key) => row[key]),
    [entries, sort]
  );

  const totalGross = useMemo(
    () => entries.reduce((s, p) => s + p.grossPay, 0),
    [entries]
  );
  const totalNet = useMemo(
    () => entries.reduce((s, p) => s + p.netPay, 0),
    [entries]
  );

  return (
    <>
      <div className="mb-6 flex flex-wrap gap-8 text-sm">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-sbc-gray">
            Period
          </p>
          <p className="mt-1 font-semibold text-sbc-black">{period.label}</p>
          <p className="mt-0.5 text-xs text-sbc-gold-dark">{period.processLabel}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-sbc-gray">
            Total Gross
          </p>
          <p className="mt-1 text-xl font-bold">{formatCurrency(totalGross)}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-sbc-gray">
            Total Net
          </p>
          <p className="mt-1 text-xl font-bold text-sbc-gold">
            {formatCurrency(totalNet)}
          </p>
        </div>
      </div>

      <TableShell minWidth={`${980 + activeModules.length * 120}px`} scrollable>
        <Table>
          <TableHeader>
            <tr>
              <SortableTableHead
                sortKey="employeeName"
                activeKey={sort.key}
                direction={sort.direction}
                onSort={(key) => onToggleSort(key as PayrollSortKey)}
              >
                Employee
              </SortableTableHead>
              <SortableTableHead
                sortKey="hours"
                align="center"
                activeKey={sort.key}
                direction={sort.direction}
                onSort={(key) => onToggleSort(key as PayrollSortKey)}
              >
                {quantityLabel}
              </SortableTableHead>
              <SortableTableHead
                sortKey="grossPay"
                align="right"
                activeKey={sort.key}
                direction={sort.direction}
                onSort={(key) => onToggleSort(key as PayrollSortKey)}
              >
                Gross
              </SortableTableHead>
              {activeModules.map((rule) => (
                <TableHead key={rule.code} align="right">
                  {rule.label}
                </TableHead>
              ))}
              <SortableTableHead
                sortKey="deductions"
                align="right"
                activeKey={sort.key}
                direction={sort.direction}
                onSort={(key) => onToggleSort(key as PayrollSortKey)}
              >
                Total Ded.
              </SortableTableHead>
              <SortableTableHead
                sortKey="netPay"
                align="right"
                activeKey={sort.key}
                direction={sort.direction}
                onSort={(key) => onToggleSort(key as PayrollSortKey)}
              >
                Net Pay
              </SortableTableHead>
              <SortableTableHead
                sortKey="status"
                align="right"
                activeKey={sort.key}
                direction={sort.direction}
                onSort={(key) => onToggleSort(key as PayrollSortKey)}
              >
                Status
              </SortableTableHead>
              <TableHead align="right">Actions</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {sortedEntries.length === 0 ? (
              <TableEmpty
                colSpan={columnCount}
                message={`No active ${category} employees for this period.`}
              />
            ) : (
              sortedEntries.map((entry) => {
                const employeeContext = employeeContextFromEntry(entry, employees);
                const breakdown = resolveEntryDeductionBreakdown(
                  entry,
                  payrollAdjustments,
                  employeeContext
                );

                return (
                <TableRow key={entry.id}>
                  <TablePrimaryCell>{entry.employeeName}</TablePrimaryCell>
                  <TableCell align="center" numeric>
                    {entry.hours}
                    {category === "construction" ? "d" : "h"}
                  </TableCell>
                  <TableCell align="right" numeric className="!font-semibold !text-sbc-black">
                    {formatCurrency(entry.grossPay)}
                  </TableCell>
                  {activeModules.map((rule) => (
                    <TableCell
                      key={rule.code}
                      align="right"
                      numeric
                      className="!text-sbc-gray"
                    >
                      {formatCurrency(getDeductionAmount(breakdown, rule.code))}
                    </TableCell>
                  ))}
                  <TableCell align="right" numeric className="!text-sbc-gray">
                    {formatCurrency(entry.deductions)}
                  </TableCell>
                  <TableCell align="right" numeric className="!font-bold !text-sbc-gold">
                    {formatCurrency(entry.netPay)}
                  </TableCell>
                  <TableCell align="right">
                    <span
                      className={`text-xs font-semibold uppercase tracking-widest ${
                        entry.status === "processed" ? "text-sbc-gold" : "text-sbc-gray"
                      }`}
                    >
                      {entry.status}
                    </span>
                  </TableCell>
                  <TableCell align="right">
                    <TableRowActions>
                      <TableEditButton onClick={() => onStartEdit(entry)} />
                      {entry.status === "draft" && (
                        <TableProcessButton
                          onClick={() => onProcess(entry.id)}
                          disabled={pendingId === entry.id}
                        />
                      )}
                    </TableRowActions>
                  </TableCell>
                </TableRow>
              );
              })
            )}
          </TableBody>
        </Table>
        <TableMeta>
          <span>{entries.length} employees</span>
          <span className="text-sbc-gold">Net total · {formatCurrency(totalNet)}</span>
        </TableMeta>
      </TableShell>

      {editingId && (
        <p className="sr-only">
          Editing {quantityLabel.toLowerCase()}: {form.hours}
        </p>
      )}
    </>
  );
}

export function PayrollClient({
  initialConstructionEntries,
  initialAdminEntries,
  initialOjtEntries,
  initialConstructionPeriod,
  initialAdminPeriod,
  initialOjtPeriod,
  usingDatabase,
  employees,
  dailyRates,
  constructionAttendance,
  adminAttendance,
  ojtAttendance,
  payrollAdjustments,
}: Props) {
  const [activeTab, setActiveTab] = useState<PayrollTab>("construction");
  const [constructionEntries, setConstructionEntries] = useState(() =>
    applyPreviewAttendanceToPayroll(
      initialConstructionEntries,
      employees,
      dailyRates,
      constructionAttendance,
      adminAttendance,
      "construction",
      initialConstructionPeriod,
      payrollAdjustments
    )
  );
  const [adminEntries, setAdminEntries] = useState(() =>
    applyPreviewAttendanceToPayroll(
      initialAdminEntries,
      employees,
      dailyRates,
      constructionAttendance,
      adminAttendance,
      "admin",
      initialAdminPeriod,
      payrollAdjustments
    )
  );
  const [ojtEntries, setOjtEntries] = useState(() =>
    applyPreviewAttendanceToPayroll(
      initialOjtEntries,
      employees,
      dailyRates,
      constructionAttendance,
      ojtAttendance,
      "ojt",
      initialOjtPeriod,
      payrollAdjustments
    )
  );
  const [constructionPeriod, setConstructionPeriod] = useState(
    initialConstructionPeriod
  );
  const [adminPeriod, setAdminPeriod] = useState(initialAdminPeriod);
  const [ojtPeriod, setOjtPeriod] = useState(initialOjtPeriod);
  const [serverConstructionAttendance, setServerConstructionAttendance] =
    useState(constructionAttendance);
  const [serverAdminAttendance, setServerAdminAttendance] =
    useState(adminAttendance);
  const [serverOjtAttendance, setServerOjtAttendance] = useState(ojtAttendance);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PayrollForm>({
    hours: "",
    grossPay: "",
    deductionLines: {},
    status: "draft",
  });
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loadingPeriod, setLoadingPeriod] = useState(false);
  const [pending, startTransition] = useTransition();
  const { sort, toggleSort } = useTableSort<PayrollSortKey>({
    defaultKey: "employeeName",
  });

  const activeMeta = payrollTabMeta[activeTab];
  const activePeriod =
    activeTab === "construction"
      ? constructionPeriod
      : activeTab === "admin"
        ? adminPeriod
        : ojtPeriod;
  const activeEntries =
    activeTab === "construction"
      ? constructionEntries
      : activeTab === "admin"
        ? adminEntries
        : ojtEntries;
  const setActiveEntries =
    activeTab === "construction"
      ? setConstructionEntries
      : activeTab === "admin"
        ? setAdminEntries
        : setOjtEntries;
  const quantityLabel =
    activeTab === "construction" ? "Days Worked" : "Hours";

  const activeDeductionModules = useMemo(
    () =>
      payrollAdjustments
        .filter((rule) => rule.active)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [payrollAdjustments]
  );

  function applyPeriodResult(
    tab: PayrollTab,
    result: Awaited<ReturnType<typeof getPayrollForPeriod>>
  ) {
    if (tab === "construction") {
      setConstructionEntries(
        applyPreviewAttendanceToPayroll(
          result.entries,
          employees,
          dailyRates,
          result.constructionAttendance,
          [],
          tab,
          result.period,
          payrollAdjustments
        )
      );
      setConstructionPeriod(result.period);
      setServerConstructionAttendance(result.constructionAttendance);
      return;
    }

    if (tab === "admin") {
      setAdminEntries(
        applyPreviewAttendanceToPayroll(
          result.entries,
          employees,
          dailyRates,
          result.constructionAttendance,
          result.hourlyAttendance,
          tab,
          result.period,
          payrollAdjustments
        )
      );
      setAdminPeriod(result.period);
      setServerAdminAttendance(result.hourlyAttendance);
      return;
    }

    setOjtEntries(
      applyPreviewAttendanceToPayroll(
        result.entries,
        employees,
        dailyRates,
        result.constructionAttendance,
        result.hourlyAttendance,
        tab,
        result.period,
        payrollAdjustments
      )
    );
    setOjtPeriod(result.period);
    setServerOjtAttendance(result.hourlyAttendance);
  }

  const netPreview = useMemo(() => {
    const gross = Number(form.grossPay) || 0;
    const deductions = sumDeductionLines(
      breakdownFromForm(form, payrollAdjustments)
    );
    return Math.max(gross - deductions, 0);
  }, [form, payrollAdjustments]);

  const totalDeductionPreview = useMemo(
    () => sumDeductionLines(breakdownFromForm(form, payrollAdjustments)),
    [form, payrollAdjustments]
  );

  function getEditingEmployeeContext(): EmployeeDeductionContext | undefined {
    if (!editingId) return undefined;
    const entry = activeEntries.find((item) => item.id === editingId);
    if (!entry) return undefined;
    return employeeContextFromEntry(entry, employees);
  }

  function resetForm() {
    setEditingId(null);
    setForm({ hours: "", grossPay: "", deductionLines: {}, status: "draft" });
  }

  function startEdit(entry: PayrollEntry) {
    const employeeContext = employeeContextFromEntry(entry, employees);
    const breakdown = resolveEntryDeductionBreakdown(
      entry,
      payrollAdjustments,
      employeeContext
    );
    setEditingId(entry.id);
    setForm({
      hours: String(entry.hours),
      grossPay: String(entry.grossPay),
      deductionLines: Object.fromEntries(
        breakdown.map((line) => [line.code, String(line.amount)])
      ),
      status: entry.status,
    });
    setMessage(null);
  }

  function updateGrossPay(value: string) {
    setForm({
      ...form,
      grossPay: value,
      deductionLines: buildFormDeductionLines(
        value,
        payrollAdjustments,
        getEditingEmployeeContext()
      ),
    });
  }

  function updateDeductionLine(code: string, value: string) {
    setForm({
      ...form,
      deductionLines: { ...form.deductionLines, [code]: value },
    });
  }

  function loadPeriod(direction: -1 | 1) {
    setLoadingPeriod(true);
    setMessage(null);
    resetForm();

    const nextPeriod = shiftPayrollPeriod(activeTab, activePeriod, direction);

    startTransition(async () => {
      const result = await getPayrollForPeriod(activeTab, nextPeriod.key);
      applyPeriodResult(activeTab, result);
      setLoadingPeriod(false);
    });
  }

  function jumpToCurrentPeriod() {
    setLoadingPeriod(true);
    setMessage(null);
    resetForm();

    const current = getCurrentPayrollPeriod(activeTab);

    startTransition(async () => {
      const result = await getPayrollForPeriod(activeTab, current.key);
      applyPeriodResult(activeTab, result);
      setLoadingPeriod(false);
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;

    startTransition(async () => {
      const deductionBreakdown = breakdownFromForm(form, payrollAdjustments);
      const deductions = sumDeductionLines(deductionBreakdown);
      const payload = {
        hours: Number(form.hours),
        gross_pay: Number(form.grossPay),
        deductions,
        net_pay: netPreview,
        status: form.status,
      };

      const result = await updatePayrollEntry(editingId, payload);
      if (result.error) {
        setMessage(result.error);
        return;
      }

      const updatedEntry: PayrollEntry = {
        ...(activeEntries.find((entry) => entry.id === editingId) ?? {
          id: editingId,
          employeeId: "",
          employeeName: "",
          category: activeTab,
          periodKey: activePeriod.key,
          period: activePeriod.label,
        }),
        hours: payload.hours,
        grossPay: payload.gross_pay,
        deductions: payload.deductions,
        deductionBreakdown,
        netPay: payload.net_pay,
        status: payload.status,
      };

      savePayrollEntryPreview(updatedEntry);

      setActiveEntries((prev) =>
        prev.map((entry) => (entry.id === editingId ? updatedEntry : entry))
      );
      setMessage("Payroll entry updated.");
      resetForm();
    });
  }

  function handleProcess(id: string) {
    setPendingId(id);
    startTransition(async () => {
      const entry = activeEntries.find((e) => e.id === id);
      if (!entry) {
        setPendingId(null);
        return;
      }

      const result = await updatePayrollEntry(id, {
        hours: entry.hours,
        gross_pay: entry.grossPay,
        deductions: entry.deductions,
        net_pay: entry.netPay,
        status: "processed",
      });

      if (result.error) {
        setMessage(result.error);
        setPendingId(null);
        return;
      }

      const processedEntry = { ...entry, status: "processed" as const };
      savePayrollEntryPreview(processedEntry);

      setActiveEntries((prev) =>
        prev.map((item) => (item.id === id ? processedEntry : item))
      );
      setPendingId(null);
    });
  }

  const isBusy = pending || loadingPeriod;

  return (
    <>
      <div className="payroll-screen">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-sbc-gray">
            Admin
          </p>
          <h1 className="mt-2 text-2xl font-bold text-sbc-gold">Payroll</h1>
          <p className="mt-1 text-sm text-sbc-gray">{activeMeta.description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isBusy}
            onClick={() => loadPeriod(-1)}
          >
            ← Prev
          </Button>
          <span className="min-w-[140px] text-center text-sm font-medium text-sbc-black">
            {activePeriod.label}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isBusy}
            onClick={() => loadPeriod(1)}
          >
            Next →
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isBusy}
            onClick={jumpToCurrentPeriod}
          >
            {usesWeeklyPayroll(activeTab) ? "This Week" : "Current Period"}
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={activeEntries.length === 0}
            onClick={() => window.print()}
          >
            Print Slips
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
              onClick={() => {
                setActiveTab(tab.id);
                resetForm();
              }}
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

      <p className="mb-4 rounded-md border border-sbc-gold/25 bg-sbc-gold/5 px-4 py-3 text-sm text-sbc-gray">
        <span className="font-semibold text-sbc-black">Pay schedule · </span>
        {activeMeta.scheduleNote}
      </p>

      <p className="mb-4 text-sm text-sbc-gray">
        Draft rows auto-calculate from attendance (days worked or hours) and{" "}
        <a href="/admin/contributions" className="font-medium text-sbc-gold hover:underline">
          Statutory Deductions
        </a>{" "}
        rules. Process to lock an entry.
      </p>

      {!usingDatabase && (
        <p className="mb-4 text-sm text-sbc-gray">
          Preview mode — attendance is read from this browser; connect Supabase
          for permanent storage.
        </p>
      )}

      {message && (
        <p className="mb-6 border border-sbc-gold/30 bg-sbc-gold/10 px-4 py-3 text-sm font-semibold text-sbc-black">
          {message}
        </p>
      )}

      {editingId && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 grid gap-4 border border-sbc-gray-light bg-sbc-white p-6 md:grid-cols-2"
        >
          <p className="md:col-span-2 text-xs font-medium uppercase tracking-widest text-sbc-gold">
            Edit Payroll Entry
          </p>
          <Input
            label={quantityLabel}
            size="sm"
            type="number"
            min="0"
            step={activeTab === "construction" ? "1" : "0.5"}
            value={form.hours}
            onChange={(e) => setForm({ ...form, hours: e.target.value })}
            required
          />
          <Input
            label="Gross Pay (PHP)"
            size="sm"
            type="number"
            min="0"
            step="0.01"
            value={form.grossPay}
            onChange={(e) => updateGrossPay(e.target.value)}
            required
          />
          {activeDeductionModules.map((rule) => (
            <Input
              key={rule.code}
              label={`${rule.label} (PHP)`}
              size="sm"
              type="number"
              min="0"
              step="0.01"
              value={form.deductionLines[rule.code] ?? "0"}
              onChange={(e) => updateDeductionLine(rule.code, e.target.value)}
              required
            />
          ))}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium uppercase tracking-widest text-sbc-gray">
              Total Deductions
            </p>
            <p className="border border-sbc-gray-light bg-sbc-off-white px-3 py-2 text-sm font-semibold text-sbc-black">
              {formatCurrency(totalDeductionPreview)}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium uppercase tracking-widest text-sbc-gray">
              Net Pay
            </p>
            <p className="border border-sbc-gray-light bg-sbc-off-white px-3 py-2 text-sm font-semibold text-sbc-gold">
              {formatCurrency(netPreview)}
            </p>
          </div>
          <Select
            label="Status"
            size="sm"
            value={form.status}
            onChange={(e) =>
              setForm({ ...form, status: e.target.value as "draft" | "processed" })
            }
          >
            <option value="draft">Draft</option>
            <option value="processed">Processed</option>
          </Select>
          <div className="md:col-span-2 flex flex-wrap gap-3">
            <Button type="submit" size="sm" disabled={pending}>
              Update Entry
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      <PayrollTable
        entries={activeEntries}
        category={activeTab}
        period={activePeriod}
        payrollAdjustments={payrollAdjustments}
        employees={employees}
        editingId={editingId}
        form={form}
        pending={pending}
        pendingId={pendingId}
        sort={sort}
        onToggleSort={toggleSort}
        onStartEdit={startEdit}
        onProcess={handleProcess}
      />
      </div>

      <PayrollPrintSheet
        entries={activeEntries}
        category={activeTab}
        period={activePeriod}
        payrollAdjustments={payrollAdjustments}
        employees={employees}
      />
    </>
  );
}
