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
import { calculatePayrollAmounts } from "@/lib/payroll-calculations";
import {
  buildPayrollCsv,
  payrollExportFilename,
} from "@/lib/payroll-export";

type Props = {
  initialConstructionEntries: PayrollEntry[];
  initialAdminEntries: PayrollEntry[];
  initialOjtEntries: PayrollEntry[];
  initialConstructionPeriod: PayrollPeriod;
  initialAdminPeriod: PayrollPeriod;
  initialOjtPeriod: PayrollPeriod;
  usingDatabase: boolean;
  employees: Employee[];
  constructionAttendance: AttendanceRow[];
  adminAttendance: AdminAttendanceRow[];
  ojtAttendance: AdminAttendanceRow[];
  payrollAdjustments: PayrollAdjustment[];
};

type PayrollForm = {
  hours: string;
  overtimeHours: string;
  cashAdvance: string;
  additionalPay: string;
  siteAssignment: string;
  disbursement: string;
  remarks: string;
  chargedTo: string;
  deductionLines: Record<string, string>;
  status: "draft" | "processed";
};

function buildFormDeductionLines(
  grossPay: number,
  rules: PayrollAdjustment[],
  employee?: EmployeeDeductionContext
): Record<string, string> {
  const breakdown = buildDeductionBreakdown(grossPay || 0, rules, employee);
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
                    <dt>Employee No.</dt>
                    <dd>{entry.employeeNumber || "—"}</dd>
                  </div>
                  <div>
                    <dt>Site / Designation</dt>
                    <dd>
                      {[entry.siteAssignment, entry.designation]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt>Regular Hours / Pay</dt>
                    <dd>{entry.hours}h · {formatCurrency(entry.regularPay)}</dd>
                  </div>
                  <div>
                    <dt>OT Hours / Pay</dt>
                    <dd>
                      {entry.overtimeHours}h · {formatCurrency(entry.overtimePay)}
                    </dd>
                  </div>
                  <div>
                    <dt>Gross Pay</dt>
                    <dd>{formatCurrency(entry.grossPay)}</dd>
                  </div>
                  <div>
                    <dt>Cash Advance</dt>
                    <dd>{formatCurrency(entry.cashAdvance)}</dd>
                  </div>
                  <div>
                    <dt>Additional Pay</dt>
                    <dd>{formatCurrency(entry.additionalPay)}</dd>
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
                  {entry.disbursement && (
                    <div>
                      <dt>Disbursement</dt>
                      <dd>{entry.disbursement}</dd>
                    </div>
                  )}
                  {entry.remarks && (
                    <div>
                      <dt>Remarks</dt>
                      <dd>{entry.remarks}</dd>
                    </div>
                  )}
                  {entry.chargedTo && (
                    <div>
                      <dt>Charged To</dt>
                      <dd>{entry.chargedTo}</dd>
                    </div>
                  )}
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
  editingId,
  form,
  pendingId,
  sort,
  onToggleSort,
  onStartEdit,
  onProcess,
}: {
  entries: PayrollEntry[];
  category: PayrollTab;
  period: PayrollPeriod;
  editingId: string | null;
  form: PayrollForm;
  pendingId: string | null;
  sort: ReturnType<typeof useTableSort<PayrollSortKey>>["sort"];
  onToggleSort: (key: PayrollSortKey) => void;
  onStartEdit: (entry: PayrollEntry) => void;
  onProcess: (id: string) => void;
}) {
  const columnCount = 20;
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

      <TableShell minWidth="2700px" scrollable>
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Employee No.</TableHead>
              <SortableTableHead
                sortKey="employeeName"
                activeKey={sort.key}
                direction={sort.direction}
                onSort={(key) => onToggleSort(key as PayrollSortKey)}
              >
                Employee
              </SortableTableHead>
              <TableHead>Site Assignment</TableHead>
              <TableHead align="right">Daily Rate</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead align="right">Hourly Rate</TableHead>
              <SortableTableHead
                sortKey="hours"
                align="center"
                activeKey={sort.key}
                direction={sort.direction}
                onSort={(key) => onToggleSort(key as PayrollSortKey)}
              >
                Regular Hours
              </SortableTableHead>
              <TableHead align="right">OT Hours</TableHead>
              <TableHead align="right">Regular Pay</TableHead>
              <TableHead align="right">OT Pay</TableHead>
              <SortableTableHead
                sortKey="grossPay"
                align="right"
                activeKey={sort.key}
                direction={sort.direction}
                onSort={(key) => onToggleSort(key as PayrollSortKey)}
              >
                Gross
              </SortableTableHead>
              <TableHead align="right">Cash Advance</TableHead>
              <TableHead align="right">Additional Pay</TableHead>
              <SortableTableHead
                sortKey="deductions"
                align="right"
                activeKey={sort.key}
                direction={sort.direction}
                onSort={(key) => onToggleSort(key as PayrollSortKey)}
              >
                Statutory Ded.
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
              <TableHead>Disbursement</TableHead>
              <TableHead>Remarks</TableHead>
              <TableHead>Charged To</TableHead>
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
                return (
                <TableRow key={entry.id}>
                  <TableCell className="!text-sbc-gray">
                    {entry.employeeNumber || "—"}
                  </TableCell>
                  <TablePrimaryCell>{entry.employeeName}</TablePrimaryCell>
                  <TableCell>{entry.siteAssignment || "—"}</TableCell>
                  <TableCell align="right" numeric>
                    {formatCurrency(entry.dailyRate)}
                  </TableCell>
                  <TableCell>{entry.designation || "—"}</TableCell>
                  <TableCell align="right" numeric>
                    {formatCurrency(entry.hourlyRate)}
                  </TableCell>
                  <TableCell align="center" numeric>
                    {entry.hours}h
                  </TableCell>
                  <TableCell align="right" numeric>{entry.overtimeHours}h</TableCell>
                  <TableCell align="right" numeric>
                    {formatCurrency(entry.regularPay)}
                  </TableCell>
                  <TableCell align="right" numeric>
                    {formatCurrency(entry.overtimePay)}
                  </TableCell>
                  <TableCell align="right" numeric className="!font-semibold !text-sbc-black">
                    {formatCurrency(entry.grossPay)}
                  </TableCell>
                  <TableCell align="right" numeric>
                    {formatCurrency(entry.cashAdvance)}
                  </TableCell>
                  <TableCell align="right" numeric>
                    {formatCurrency(entry.additionalPay)}
                  </TableCell>
                  <TableCell align="right" numeric className="!text-sbc-gray">
                    {formatCurrency(entry.deductions)}
                  </TableCell>
                  <TableCell align="right" numeric className="!font-bold !text-sbc-gold">
                    {formatCurrency(entry.netPay)}
                  </TableCell>
                  <TableCell>{entry.disbursement || "—"}</TableCell>
                  <TableCell>{entry.remarks || "—"}</TableCell>
                  <TableCell>{entry.chargedTo || "—"}</TableCell>
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
          Editing regular hours: {form.hours}
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
  employees,
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
  const [, setServerConstructionAttendance] =
    useState(constructionAttendance);
  const [, setServerAdminAttendance] =
    useState(adminAttendance);
  const [, setServerOjtAttendance] = useState(ojtAttendance);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PayrollForm>({
    hours: "",
    overtimeHours: "",
    cashAdvance: "",
    additionalPay: "",
    siteAssignment: "",
    disbursement: "",
    remarks: "",
    chargedTo: "",
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

  const editingEntry = editingId
    ? activeEntries.find((item) => item.id === editingId)
    : undefined;

  const amountPreview = useMemo(() => {
    const deductions = sumDeductionLines(
      breakdownFromForm(form, payrollAdjustments)
    );
    return calculatePayrollAmounts({
      hourlyRate: editingEntry?.hourlyRate ?? 0,
      regularHours: Number(form.hours) || 0,
      overtimeHours: Number(form.overtimeHours) || 0,
      cashAdvance: Number(form.cashAdvance) || 0,
      additionalPay: Number(form.additionalPay) || 0,
      statutoryDeductions: deductions,
    });
  }, [editingEntry?.hourlyRate, form, payrollAdjustments]);

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
    setForm({
      hours: "",
      overtimeHours: "",
      cashAdvance: "",
      additionalPay: "",
      siteAssignment: "",
      disbursement: "",
      remarks: "",
      chargedTo: "",
      deductionLines: {},
      status: "draft",
    });
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
      overtimeHours: String(entry.overtimeHours),
      cashAdvance: String(entry.cashAdvance),
      additionalPay: String(entry.additionalPay),
      siteAssignment: entry.siteAssignment,
      disbursement: entry.disbursement,
      remarks: entry.remarks,
      chargedTo: entry.chargedTo,
      deductionLines: Object.fromEntries(
        breakdown.map((line) => [line.code, String(line.amount)])
      ),
      status: entry.status,
    });
    setMessage(null);
  }

  function updateHours(field: "hours" | "overtimeHours", value: string) {
    const next = { ...form, [field]: value };
    const amounts = calculatePayrollAmounts({
      hourlyRate: editingEntry?.hourlyRate ?? 0,
      regularHours: Number(next.hours) || 0,
      overtimeHours: Number(next.overtimeHours) || 0,
    });
    setForm({
      ...next,
      deductionLines: buildFormDeductionLines(
        amounts.grossPay,
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
      try {
        const result = await getPayrollForPeriod(activeTab, nextPeriod.key);
        applyPeriodResult(activeTab, result);
      } finally {
        setLoadingPeriod(false);
      }
    });
  }

  function jumpToCurrentPeriod() {
    setLoadingPeriod(true);
    setMessage(null);
    resetForm();

    const current = getCurrentPayrollPeriod(activeTab);

    startTransition(async () => {
      try {
        const result = await getPayrollForPeriod(activeTab, current.key);
        applyPeriodResult(activeTab, result);
      } finally {
        setLoadingPeriod(false);
      }
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    const currentEntry = activeEntries.find((entry) => entry.id === editingId);
    if (!currentEntry) {
      setMessage("Payroll entry could not be found.");
      return;
    }

    startTransition(async () => {
      const deductionBreakdown = breakdownFromForm(form, payrollAdjustments);
      const deductions = sumDeductionLines(deductionBreakdown);
      const payload = {
        hours: Number(form.hours),
        overtime_hours: Number(form.overtimeHours),
        regular_pay: amountPreview.regularPay,
        overtime_pay: amountPreview.overtimePay,
        gross_pay: amountPreview.grossPay,
        cash_advance: Number(form.cashAdvance),
        additional_pay: Number(form.additionalPay),
        deductions,
        net_pay: amountPreview.netPay,
        site_assignment: form.siteAssignment.trim(),
        disbursement: form.disbursement.trim(),
        remarks: form.remarks.trim(),
        charged_to: form.chargedTo.trim(),
        status: form.status,
      };

      const result = await updatePayrollEntry(editingId, payload);
      if (result.error) {
        setMessage(result.error);
        return;
      }

      const updatedEntry: PayrollEntry = {
        ...currentEntry,
        hours: payload.hours,
        overtimeHours: payload.overtime_hours,
        regularPay: payload.regular_pay,
        overtimePay: payload.overtime_pay,
        grossPay: payload.gross_pay,
        cashAdvance: payload.cash_advance,
        additionalPay: payload.additional_pay,
        deductions: payload.deductions,
        deductionBreakdown,
        netPay: payload.net_pay,
        siteAssignment: payload.site_assignment,
        disbursement: payload.disbursement,
        remarks: payload.remarks,
        chargedTo: payload.charged_to,
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
        overtime_hours: entry.overtimeHours,
        regular_pay: entry.regularPay,
        overtime_pay: entry.overtimePay,
        gross_pay: entry.grossPay,
        cash_advance: entry.cashAdvance,
        additional_pay: entry.additionalPay,
        deductions: entry.deductions,
        net_pay: entry.netPay,
        site_assignment: entry.siteAssignment,
        disbursement: entry.disbursement,
        remarks: entry.remarks,
        charged_to: entry.chargedTo,
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

  function handleExportPayroll() {
    const csv = buildPayrollCsv({
      entries: activeEntries,
      employees,
      payrollAdjustments,
      category: activeTab,
      period: activePeriod,
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = payrollExportFilename(activeTab, activePeriod);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setMessage(
      `${activeMeta.label} payroll for ${activePeriod.label} exported successfully.`
    );
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
            variant="ghost"
            size="sm"
            disabled={activeEntries.length === 0}
            onClick={handleExportPayroll}
          >
            Export CSV
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

      <p className="mb-4 rounded-lg border border-sbc-gold/25 bg-sbc-gold/5 px-4 py-3 text-sm text-sbc-gray">
        <span className="font-semibold text-sbc-black">Pay schedule · </span>
        {activeMeta.scheduleNote}
      </p>

      <p className="mb-4 text-sm text-sbc-gray">
        Rates are employee-specific. Monthly pay is converted using 26 workdays and
        8 hours per day. Draft rows calculate regular hours from attendance, and
        overtime uses the normal hourly rate (1.0×), matching the provided payroll
        sheet.{" "}
        <a href="/admin/contributions" className="font-medium text-sbc-gold hover:underline">
          Statutory Deductions
        </a>{" "}
        remain included. Process to lock an entry.
      </p>

      {message && (
        <p className="mb-6 rounded-lg border border-sbc-gold/30 bg-sbc-gold/10 px-4 py-3 text-sm font-semibold text-sbc-black">
          {message}
        </p>
      )}

      {editingId && (
        <form
          onSubmit={handleSubmit}
          className="mb-8 grid gap-4 rounded-lg border border-sbc-gray-light bg-sbc-white p-6 md:grid-cols-2"
        >
          <p className="md:col-span-2 text-xs font-medium uppercase tracking-widest text-sbc-gold">
            Edit Payroll Entry
          </p>
          <div className="md:col-span-2 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              ["Daily Rate", formatCurrency(editingEntry?.dailyRate ?? 0)],
              ["Hourly Rate", formatCurrency(editingEntry?.hourlyRate ?? 0)],
              ["Regular Pay", formatCurrency(amountPreview.regularPay)],
              ["OT Pay", formatCurrency(amountPreview.overtimePay)],
              ["Gross Pay", formatCurrency(amountPreview.grossPay)],
              ["Net Pay", formatCurrency(amountPreview.netPay)],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-lg border border-sbc-gray-light bg-sbc-off-white px-3 py-2"
              >
                <p className="text-[10px] font-medium uppercase tracking-widest text-sbc-gray">
                  {label}
                </p>
                <p className="mt-1 text-sm font-semibold text-sbc-black">{value}</p>
              </div>
            ))}
          </div>
          <Input
            label="Regular Hours"
            size="sm"
            type="number"
            min="0"
            step="0.25"
            value={form.hours}
            onChange={(e) => updateHours("hours", e.target.value)}
            required
          />
          <Input
            label="OT Hours"
            size="sm"
            type="number"
            min="0"
            step="0.25"
            value={form.overtimeHours}
            onChange={(e) => updateHours("overtimeHours", e.target.value)}
            required
          />
          <Input
            label="Cash Advance (PHP)"
            size="sm"
            type="number"
            min="0"
            step="0.01"
            value={form.cashAdvance}
            onChange={(e) => setForm({ ...form, cashAdvance: e.target.value })}
            required
          />
          <Input
            label="Additional Pay (PHP)"
            size="sm"
            type="number"
            min="0"
            step="0.01"
            value={form.additionalPay}
            onChange={(e) => setForm({ ...form, additionalPay: e.target.value })}
            required
          />
          <Input
            label="Site Assignment"
            size="sm"
            value={form.siteAssignment}
            onChange={(e) => setForm({ ...form, siteAssignment: e.target.value })}
          />
          <Input
            label="Disbursement"
            size="sm"
            value={form.disbursement}
            onChange={(e) => setForm({ ...form, disbursement: e.target.value })}
          />
          <Input
            label="Remarks"
            size="sm"
            value={form.remarks}
            onChange={(e) => setForm({ ...form, remarks: e.target.value })}
          />
          <Input
            label="Charged To"
            size="sm"
            value={form.chargedTo}
            onChange={(e) => setForm({ ...form, chargedTo: e.target.value })}
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
            <p className="rounded-lg border border-sbc-gray-light bg-sbc-off-white px-3 py-2 text-sm font-semibold text-sbc-black">
              {formatCurrency(totalDeductionPreview)}
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
        editingId={editingId}
        form={form}
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
