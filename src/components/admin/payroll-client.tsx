"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import { sortRows, useTableSort } from "@/lib/table-sort";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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
import {
  importAdminPayrollExcel,
  importConstructionPayrollExcel,
} from "@/lib/actions/payroll-import";
import {
  adminEmploymentStatusFromRemarks,
  parseAdminPayslipMeta,
} from "@/lib/admin-payroll-excel-import";
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
import { savePayrollEntryPreview } from "@/lib/payroll-preview-storage";
import {
  getCurrentPayrollPeriod,
  parsePayrollPeriodKey,
  payrollTabMeta,
  shiftPayrollPeriod,
  type PayrollPeriod,
  type PayrollTab,
} from "@/lib/payroll-periods";
import { usesWeeklyPayroll } from "@/lib/employee-categories";
import { calculatePayrollAmounts } from "@/lib/payroll-calculations";
import {
  buildPayrollCsv,
  getPayrollUploadDate,
  payrollExportFilename,
} from "@/lib/payroll-export";
import { radii } from "@/lib/design-tokens";

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
  disbursementMethods: string[];
  otPayPercent: number;
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
  return {
    category: employee.category,
    designation: employee.designation,
    basicPay: employee.basicPay,
  };
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
  | "netPay";

const tabs: {
  id: PayrollTab;
  label: string;
  hint: string;
}[] = [
  {
    id: "construction",
    label: "Construction",
    hint: "Weekly",
  },
  {
    id: "admin",
    label: "Admin",
    hint: "Semi-monthly",
  },
];

function UploadIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 16V4M12 4L7 9M12 4L17 9"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 16.5V18.5C4 19.3284 4.67157 20 5.5 20H18.5C19.3284 20 20 19.3284 20 18.5V16.5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ExportIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 4V14M12 14L8 10M12 14L16 10"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 16.5V18.5C4 19.3284 4.67157 20 5.5 20H18.5C19.3284 20 20 19.3284 20 18.5V16.5"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PrintIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M7 8V4H17V8"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 16H5.5C4.67157 16 4 15.3284 4 14.5V10.5C4 9.67157 4.67157 9 5.5 9H18.5C19.3284 9 20 9.67157 20 10.5V14.5C20 15.3284 19.3284 16 18.5 16H17"
        stroke="currentColor"
        strokeWidth="1.9"
      />
      <path
        d="M7 13H17V20H7V13Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronLeftIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M14.5 6L8.5 12L14.5 18"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRightIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M9.5 6L15.5 12L9.5 18"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CalendarIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" className={className}>
      <rect
        x="4"
        y="5"
        width="16"
        height="15"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.9"
      />
      <path d="M8 3V7M16 3V7M4 10H20" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

function chunkEntries(entries: PayrollEntry[], size: number): PayrollEntry[][] {
  const chunks: PayrollEntry[][] = [];
  for (let index = 0; index < entries.length; index += size) {
    chunks.push(entries.slice(index, index + size));
  }
  return chunks;
}

const tableFieldClass =
  `h-9 w-full min-w-[96px] ${radii.control} border border-sbc-gray-light/90 bg-sbc-white px-2 text-sm font-medium text-sbc-black outline-none transition-colors hover:border-sbc-gold/45 focus:border-sbc-gold focus:ring-2 focus:ring-sbc-gold/20 disabled:cursor-not-allowed disabled:opacity-60`;

function InlineTextField({
  value,
  onCommit,
  disabled,
  type = "text",
  align = "left",
  className = "",
}: {
  value: string;
  onCommit: (value: string) => void;
  disabled?: boolean;
  type?: "text" | "number";
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <input
      key={value}
      type={type}
      disabled={disabled}
      defaultValue={value}
      min={type === "number" ? "0" : undefined}
      step={type === "number" ? "0.01" : undefined}
      onBlur={(e) => {
        if (e.target.value !== value) onCommit(e.target.value);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          (e.target as HTMLInputElement).blur();
        }
      }}
      className={`${tableFieldClass} ${align === "right" ? "text-right" : ""} ${className}`}
    />
  );
}

type InlinePayrollField =
  | "cashAdvance"
  | "additionalPay"
  | "disbursement"
  | "remarks"
  | "chargedTo";

function printAmount(value: number, opts?: { blankIfZero?: boolean }) {
  if (opts?.blankIfZero && value === 0) return "";
  return formatCurrency(value);
}

function PayrollPrintSheet({
  entries,
  category,
  period,
}: {
  entries: PayrollEntry[];
  category: PayrollTab;
  period: PayrollPeriod;
  payrollAdjustments: PayrollAdjustment[];
  employees: Employee[];
}) {
  const isAdmin = category === "admin";
  const printable = entries.filter((entry) => entry.netPay > 0);
  // Construction crews are large — pack 4 compact slips (2×2) per sheet.
  // Admin keeps 2 taller slips stacked per sheet.
  const slipsPerPage = isAdmin ? 2 : 4;
  const pages = chunkEntries(printable, slipsPerPage);
  const heading = isAdmin
    ? "Admin · Semi-monthly payroll"
    : "Construction · Weekly payroll";
  const pageClass = isAdmin
    ? "payroll-print-page payroll-print-page-admin"
    : "payroll-print-page payroll-print-page-construction";
  const slipClass = isAdmin
    ? "payroll-print-admin-slip"
    : "payroll-print-admin-slip payroll-print-construction-slip";

  return (
    <div className="payroll-print-area">
      {pages.map((pageEntries, pageIndex) => (
        <section
          className={pageClass}
          key={`${period.key}-${category}-${pageIndex}`}
        >
          {pageEntries.map((entry) => {
            const meta = parseAdminPayslipMeta(entry.remarks);
            const basicPay = isAdmin
              ? meta?.basicPay || 0
              : entry.regularPay;
            const leavePay = meta?.leavePay ?? entry.additionalPay;
            const sss = isAdmin ? meta?.sss ?? 0 : 0;
            const sssLoan = isAdmin ? meta?.sssLoan ?? 0 : 0;
            const phic = isAdmin ? meta?.phic ?? 0 : 0;
            const hdmf = isAdmin ? meta?.hdmf ?? 0 : 0;
            const hdmfLoan = isAdmin ? meta?.hdmfLoan ?? 0 : 0;
            const tax = isAdmin ? meta?.tax ?? 0 : 0;
            const overtimePay = entry.overtimePay;
            const cashAdvance = entry.cashAdvance;
            // Admin: Net/Gross are Excel Computation pass-through. Total
            // deductions must be Gross − Net so the slip always reconciles
            // (Excel NET formulas often include extra adjustments beyond the
            // labeled SSS/PHIC/HDMF/CA columns).
            const labeledDeductions = isAdmin
              ? cashAdvance + sss + sssLoan + phic + hdmf + hdmfLoan + tax
              : cashAdvance;
            const totalDeductions = isAdmin
              ? Math.round((entry.grossPay - entry.netPay) * 100) / 100
              : cashAdvance;
            const otherDeductions = isAdmin
              ? Math.round((totalDeductions - labeledDeductions) * 100) / 100
              : 0;

            const earningRows = isAdmin
              ? [
                  {
                    label: "Basic Salary",
                    amount: printAmount(basicPay),
                  },
                  {
                    label: "Overtime Pay",
                    amount: printAmount(overtimePay, { blankIfZero: true }),
                  },
                  { label: "", amount: "" },
                  { label: "", amount: "" },
                  {
                    label: "Gross Earnings",
                    amount: printAmount(entry.grossPay),
                    strong: true,
                  },
                  {
                    label: "Leave Credits",
                    amount: printAmount(leavePay, { blankIfZero: true }),
                  },
                ]
              : [
                  {
                    label: "Regular Pay",
                    amount: printAmount(basicPay),
                  },
                  {
                    label: "Overtime Pay",
                    amount:
                      overtimePay > 0
                        ? `${entry.overtimeHours}h · ${printAmount(overtimePay)}`
                        : printAmount(overtimePay, { blankIfZero: true }),
                  },
                  {
                    label: "Regular Hours",
                    amount: `${entry.hours}h`,
                  },
                  {
                    label: "Additional Pay",
                    amount: printAmount(entry.additionalPay, {
                      blankIfZero: true,
                    }),
                  },
                  {
                    label: "Gross Earnings",
                    amount: printAmount(entry.grossPay),
                    strong: true,
                  },
                  { label: "", amount: "" },
                ];

            const deductionRows = isAdmin
              ? [
                  {
                    label: "Cash Advance",
                    amount: printAmount(cashAdvance),
                  },
                  {
                    label: "SSS Cont",
                    amount: printAmount(sss),
                  },
                  {
                    label: "SSS Loan",
                    amount: printAmount(sssLoan),
                  },
                  {
                    label: "PHIC",
                    amount: printAmount(phic),
                  },
                  {
                    label: "HDMF Cont",
                    amount: printAmount(hdmf),
                  },
                  {
                    label: "HDMF Loan",
                    amount: printAmount(hdmfLoan),
                  },
                  ...(Math.abs(otherDeductions) >= 0.005
                    ? [
                        {
                          label: "Other adjustments",
                          amount: printAmount(otherDeductions),
                        },
                      ]
                    : []),
                  {
                    label: "Total Deductions",
                    amount: printAmount(totalDeductions),
                    strong: true,
                  },
                  {
                    label: "Net Pay",
                    amount: printAmount(entry.netPay),
                    strong: true,
                    net: true,
                  },
                ]
              : [
                  {
                    label: "Cash Advance",
                    amount: printAmount(cashAdvance),
                  },
                  { label: "", amount: "" },
                  { label: "", amount: "" },
                  { label: "", amount: "" },
                  { label: "", amount: "" },
                  { label: "", amount: "" },
                  {
                    label: "Total Deductions",
                    amount: printAmount(totalDeductions),
                    strong: true,
                  },
                  {
                    label: "Net Pay",
                    amount: printAmount(entry.netPay),
                    strong: true,
                    net: true,
                  },
                ];

            const rowCount = Math.max(earningRows.length, deductionRows.length);

            return (
              <article className={slipClass} key={entry.id}>
                <header className="payroll-print-admin-header">
                  <p className="payroll-print-eyebrow">
                    Steer Builders Corporation
                  </p>
                  <h2>Payslip</h2>
                  <p>{heading}</p>
                </header>

                <dl className="payroll-print-admin-meta">
                  <div>
                    <dt>Employee Name</dt>
                    <dd>{entry.employeeName}</dd>
                  </div>
                  <div>
                    <dt>Pay Period</dt>
                    <dd>{period.label}</dd>
                  </div>
                  <div>
                    <dt>Cut-off</dt>
                    <dd>
                      {period.periodStart} – {period.periodEnd}
                    </dd>
                  </div>
                </dl>

                <table className="payroll-print-sheet-table">
                  <thead>
                    <tr>
                      <th>Earnings</th>
                      <th>Amount</th>
                      <th>Deduction</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: rowCount }).map((_, index) => {
                      const earning = earningRows[index] ?? {
                        label: "",
                        amount: "",
                      };
                      const deduction = deductionRows[index] ?? {
                        label: "",
                        amount: "",
                      };
                      return (
                        <tr
                          key={`${entry.id}-row-${index}`}
                          className={
                            deduction.net
                              ? "payroll-print-sheet-net-row"
                              : undefined
                          }
                        >
                          <td
                            className={
                              earning.strong
                                ? "payroll-print-sheet-strong"
                                : undefined
                            }
                          >
                            {earning.label}
                          </td>
                          <td
                            className={`payroll-print-sheet-amount${
                              earning.strong
                                ? " payroll-print-sheet-strong"
                                : ""
                            }`}
                          >
                            {earning.amount}
                          </td>
                          <td
                            className={
                              deduction.strong || deduction.net
                                ? "payroll-print-sheet-strong"
                                : undefined
                            }
                          >
                            {deduction.label}
                          </td>
                          <td
                            className={`payroll-print-sheet-amount${
                              deduction.strong || deduction.net
                                ? " payroll-print-sheet-strong"
                                : ""
                            }`}
                          >
                            {deduction.amount}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {category === "construction" && entry.disbursement ? (
                  <p className="payroll-print-disbursement">
                    Disbursement: {entry.disbursement}
                  </p>
                ) : null}

                <div className="payroll-print-signatures payroll-print-signatures-named">
                  <div>
                    <span className="payroll-print-sign-line" />
                    <strong>Faye Charlotte Abellanosa</strong>
                    <em>Approved by</em>
                    <span className="payroll-print-sign-line payroll-print-sign-line-blank" />
                    <em>Other approver</em>
                  </div>
                  <div>
                    <span className="payroll-print-sign-line" />
                    <strong>{entry.employeeName}</strong>
                    <em>Received by</em>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      ))}
    </div>
  );
}

function PayrollTable({
  entries,
  category,
  period,
  pendingId,
  sort,
  disbursementMethods,
  onToggleSort,
  onInlineUpdate,
}: {
  entries: PayrollEntry[];
  category: PayrollTab;
  period: PayrollPeriod;
  pendingId: string | null;
  sort: ReturnType<typeof useTableSort<PayrollSortKey>>["sort"];
  disbursementMethods: string[];
  onToggleSort: (key: PayrollSortKey) => void;
  onInlineUpdate: (
    entry: PayrollEntry,
    field: InlinePayrollField,
    value: string
  ) => void;
}) {
  const isAdminTable = category === "admin";
  const showDisbursementColumns = category === "construction";
  const columnCount = isAdminTable ? 13 : 16;

  const payableEntries = useMemo(
    () => entries.filter((entry) => entry.netPay > 0),
    [entries]
  );

  const excelPeriodCode = useMemo(() => {
    if (!isAdminTable || payableEntries.length === 0) return "";
    return (
      parseAdminPayslipMeta(payableEntries[0]?.remarks)?.periodCode ?? ""
    );
  }, [isAdminTable, payableEntries]);

  const sortedEntries = useMemo(
    () => sortRows(payableEntries, sort, (row, key) => row[key]),
    [payableEntries, sort]
  );

  const totalGross = useMemo(
    () => payableEntries.reduce((s, p) => s + p.grossPay, 0),
    [payableEntries]
  );
  const totalNet = useMemo(
    () => payableEntries.reduce((s, p) => s + p.netPay, 0),
    [payableEntries]
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
          {excelPeriodCode ? (
            <p className="mt-0.5 text-xs text-sbc-gray">
              Excel · {excelPeriodCode}
            </p>
          ) : null}
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

      <TableShell
        minWidth={isAdminTable ? "1400px" : "2400px"}
        scrollable
        className="rounded-none border-0"
      >
        <Table>
          <TableHeader>
            {isAdminTable ? (
              <tr>
                <SortableTableHead
                  sortKey="employeeName"
                  sticky
                  activeKey={sort.key}
                  direction={sort.direction}
                  onSort={(key) => onToggleSort(key as PayrollSortKey)}
                >
                  Employee
                </SortableTableHead>
                <TableHead>Status</TableHead>
                <TableHead>Class</TableHead>
                <SortableTableHead
                  sortKey="netPay"
                  align="right"
                  activeKey={sort.key}
                  direction={sort.direction}
                  onSort={(key) => onToggleSort(key as PayrollSortKey)}
                >
                  Net
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
                <TableHead align="right">OT</TableHead>
                <TableHead align="right">Leave</TableHead>
                <TableHead align="right">Tax</TableHead>
                <TableHead align="right">SSS Cont</TableHead>
                <TableHead align="right">PHIC</TableHead>
                <TableHead align="right">HDMF Cont</TableHead>
                <TableHead align="right">CA</TableHead>
                <TableHead align="right">Basic Pay</TableHead>
              </tr>
            ) : (
              <tr>
                <SortableTableHead
                  sortKey="employeeName"
                  sticky
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
                  Hours
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
                  sortKey="netPay"
                  align="right"
                  activeKey={sort.key}
                  direction={sort.direction}
                  onSort={(key) => onToggleSort(key as PayrollSortKey)}
                >
                  Net
                </SortableTableHead>
                <TableHead>Disbursement</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead>Charged To</TableHead>
              </tr>
            )}
          </TableHeader>
          <TableBody>
            {sortedEntries.length === 0 ? (
              <TableEmpty
                colSpan={columnCount}
                message={`No payable ${category} payroll for this period yet (net pay must be greater than 0). Upload a payroll file to load payslips.`}
              />
            ) : (
              sortedEntries.map((entry) => {
                const rowBusy = pendingId === entry.id;
                const disbursementOptions = Array.from(
                  new Set(
                    [...disbursementMethods, entry.disbursement].filter(Boolean)
                  )
                );
                const adminMeta = parseAdminPayslipMeta(entry.remarks);
                const employmentStatus =
                  adminEmploymentStatusFromRemarks(entry.remarks);

                if (isAdminTable) {
                  return (
                    <TableRow key={entry.id}>
                      <TablePrimaryCell sticky>
                        {entry.employeeName}
                      </TablePrimaryCell>
                      <TableCell>{employmentStatus || "—"}</TableCell>
                      <TableCell>
                        {adminMeta?.employeeClass?.trim() ||
                          entry.designation ||
                          "—"}
                      </TableCell>
                      <TableCell
                        align="right"
                        numeric
                        className="!font-bold !text-sbc-gold"
                      >
                        {formatCurrency(entry.netPay)}
                      </TableCell>
                      <TableCell
                        align="right"
                        numeric
                        className="!font-semibold !text-sbc-black"
                      >
                        {formatCurrency(entry.grossPay)}
                      </TableCell>
                      <TableCell align="right" numeric>
                        {formatCurrency(entry.overtimePay)}
                      </TableCell>
                      <TableCell align="right" numeric>
                        {formatCurrency(
                          adminMeta?.leavePay ?? entry.additionalPay
                        )}
                      </TableCell>
                      <TableCell align="right" numeric>
                        {formatCurrency(adminMeta?.tax ?? 0)}
                      </TableCell>
                      <TableCell align="right" numeric>
                        {formatCurrency(adminMeta?.sss ?? 0)}
                      </TableCell>
                      <TableCell align="right" numeric>
                        {formatCurrency(adminMeta?.phic ?? 0)}
                      </TableCell>
                      <TableCell align="right" numeric>
                        {formatCurrency(adminMeta?.hdmf ?? 0)}
                      </TableCell>
                      <TableCell align="right" numeric>
                        {formatCurrency(entry.cashAdvance)}
                      </TableCell>
                      <TableCell align="right" numeric>
                        {formatCurrency(adminMeta?.basicPay ?? entry.regularPay)}
                      </TableCell>
                    </TableRow>
                  );
                }

                return (
                  <TableRow key={entry.id}>
                    <TablePrimaryCell sticky>
                      {entry.employeeName}
                    </TablePrimaryCell>
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
                    <TableCell align="right" numeric>
                      {entry.overtimeHours}h
                    </TableCell>
                    <TableCell align="right" numeric>
                      {formatCurrency(entry.regularPay)}
                    </TableCell>
                    <TableCell align="right" numeric>
                      {formatCurrency(entry.overtimePay)}
                    </TableCell>
                    <TableCell
                      align="right"
                      numeric
                      className="!font-semibold !text-sbc-black"
                    >
                      {formatCurrency(entry.grossPay)}
                    </TableCell>
                    <TableCell align="right">
                      <InlineTextField
                        type="number"
                        align="right"
                        value={String(entry.cashAdvance || 0)}
                        disabled={rowBusy}
                        onCommit={(value) =>
                          onInlineUpdate(entry, "cashAdvance", value)
                        }
                      />
                    </TableCell>
                    <TableCell align="right">
                      <InlineTextField
                        type="number"
                        align="right"
                        value={String(entry.additionalPay || 0)}
                        disabled={rowBusy}
                        onCommit={(value) =>
                          onInlineUpdate(entry, "additionalPay", value)
                        }
                      />
                    </TableCell>
                    <TableCell
                      align="right"
                      numeric
                      className="!font-bold !text-sbc-gold"
                    >
                      {formatCurrency(entry.netPay)}
                    </TableCell>
                    {showDisbursementColumns ? (
                      <TableCell>
                        <select
                          disabled={rowBusy}
                          value={entry.disbursement || ""}
                          onChange={(e) =>
                            onInlineUpdate(
                              entry,
                              "disbursement",
                              e.target.value
                            )
                          }
                          className={`${tableFieldClass} min-w-[120px] appearance-none bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22 fill=%22none%22%3E%3Cpath d=%22M5 7.5L10 12.5L15 7.5%22 stroke=%22%23b88f3f%22 stroke-width=%221.75%22/%3E%3C/svg%3E')] bg-[length:16px] bg-[right_8px_center] bg-no-repeat pr-8`}
                        >
                          <option value="">Select</option>
                          {disbursementOptions.map((method) => (
                            <option key={method} value={method}>
                              {method}
                            </option>
                          ))}
                        </select>
                      </TableCell>
                    ) : null}
                    <TableCell>
                      <InlineTextField
                        value={entry.remarks || ""}
                        disabled={rowBusy}
                        className="min-w-[120px]"
                        onCommit={(value) =>
                          onInlineUpdate(entry, "remarks", value)
                        }
                      />
                    </TableCell>
                    {showDisbursementColumns ? (
                      <TableCell>
                        <InlineTextField
                          value={entry.chargedTo || ""}
                          disabled={rowBusy}
                          className="min-w-[120px]"
                          onCommit={(value) =>
                            onInlineUpdate(entry, "chargedTo", value)
                          }
                        />
                      </TableCell>
                    ) : null}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <TableMeta>
          <span>
            {payableEntries.length} payable
            {entries.length > payableEntries.length
              ? ` · ${entries.length - payableEntries.length} zero-net hidden`
              : " employees"}
          </span>
          <span className="text-sbc-gold">
            Net total · {formatCurrency(totalNet)}
          </span>
        </TableMeta>
      </TableShell>
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
  disbursementMethods,
  otPayPercent,
}: Props) {
  const [activeTab, setActiveTab] = useState<PayrollTab>("construction");
  // Session-only: empty until Excel is uploaded this visit; refresh clears the table.
  const [constructionReady, setConstructionReady] = useState(false);
  const [adminReady, setAdminReady] = useState(false);
  const [constructionEntries, setConstructionEntries] = useState(
    initialConstructionEntries
  );
  const [adminEntries, setAdminEntries] = useState(initialAdminEntries);
  const [ojtEntries, setOjtEntries] = useState(initialOjtEntries);
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
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const { sort, toggleSort } = useTableSort<PayrollSortKey>({
    defaultKey: "employeeName",
  });

  const dataTab: PayrollTab =
    activeTab === "admin"
      ? "admin"
      : activeTab === "ojt"
        ? "ojt"
        : "construction";
  const sessionReady =
    dataTab === "admin"
      ? adminReady
      : dataTab === "construction"
        ? constructionReady
        : true;

  const activeMeta = payrollTabMeta[dataTab];
  const activePeriod =
    dataTab === "construction"
      ? constructionPeriod
      : dataTab === "admin"
        ? adminPeriod
        : ojtPeriod;
  const activeEntries =
    dataTab === "construction"
      ? constructionEntries
      : dataTab === "admin"
        ? adminEntries
        : ojtEntries;
  const setActiveEntries =
    dataTab === "construction"
      ? setConstructionEntries
      : dataTab === "admin"
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
      setConstructionEntries(result.entries);
      setConstructionPeriod(result.period);
      setServerConstructionAttendance(result.constructionAttendance);
      return;
    }

    if (tab === "admin") {
      setAdminEntries(result.entries);
      setAdminPeriod(result.period);
      setServerAdminAttendance(result.hourlyAttendance);
      return;
    }

    setOjtEntries(result.entries);
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
      otPayPercent,
      cashAdvance: Number(form.cashAdvance) || 0,
      additionalPay: Number(form.additionalPay) || 0,
      statutoryDeductions: deductions,
    });
  }, [editingEntry?.hourlyRate, form, payrollAdjustments, otPayPercent]);

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
      remarks: parseAdminPayslipMeta(entry.remarks) ? "" : entry.remarks,
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
      otPayPercent,
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

  function applyEmptyPeriod(tab: PayrollTab, period: typeof activePeriod) {
    if (tab === "construction") {
      setConstructionPeriod(period);
      setConstructionEntries([]);
      return;
    }
    if (tab === "admin") {
      setAdminPeriod(period);
      setAdminEntries([]);
      return;
    }
    setOjtPeriod(period);
    setOjtEntries([]);
  }

  function loadPeriod(direction: -1 | 1) {
    setMessage(null);
    resetForm();

    const nextPeriod = shiftPayrollPeriod(dataTab, activePeriod, direction);

    // Before an upload this visit, only move the period label — keep the table empty.
    if (!sessionReady) {
      applyEmptyPeriod(dataTab, nextPeriod);
      return;
    }

    // Update period chrome immediately so Prev/Next feels instant.
    if (dataTab === "construction") setConstructionPeriod(nextPeriod);
    else if (dataTab === "admin") setAdminPeriod(nextPeriod);
    else setOjtPeriod(nextPeriod);

    setLoadingPeriod(true);
    startTransition(async () => {
      try {
        const result = await getPayrollForPeriod(dataTab, nextPeriod.key);
        applyPeriodResult(dataTab, result);
      } finally {
        setLoadingPeriod(false);
      }
    });
  }

  function jumpToCurrentPeriod() {
    setMessage(null);
    resetForm();

    const current = getCurrentPayrollPeriod(dataTab);

    if (!sessionReady) {
      applyEmptyPeriod(dataTab, current);
      return;
    }

    if (dataTab === "construction") setConstructionPeriod(current);
    else if (dataTab === "admin") setAdminPeriod(current);
    else setOjtPeriod(current);

    setLoadingPeriod(true);
    startTransition(async () => {
      try {
        const result = await getPayrollForPeriod(dataTab, current.key);
        applyPeriodResult(dataTab, result);
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
      const existingAdminMeta = parseAdminPayslipMeta(currentEntry.remarks);
      const remarksValue =
        form.remarks.trim() ||
        (existingAdminMeta ? currentEntry.remarks : "");
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
        remarks: remarksValue,
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

  function handleInlineUpdate(
    entry: PayrollEntry,
    field: InlinePayrollField,
    rawValue: string
  ) {
    const cashAdvance =
      field === "cashAdvance"
        ? Math.max(Number(rawValue) || 0, 0)
        : entry.cashAdvance;
    const additionalPay =
      field === "additionalPay"
        ? Math.max(Number(rawValue) || 0, 0)
        : entry.additionalPay;
    const disbursement =
      field === "disbursement" ? rawValue.trim() : entry.disbursement;
    const remarks = field === "remarks" ? rawValue.trim() : entry.remarks;
    const chargedTo =
      field === "chargedTo" ? rawValue.trim() : entry.chargedTo;

    // Keep Excel Regular/OT/Gross intact. Only adjust Net when CA /
    // Additional Pay change: Net = Gross + Additional − CA − deductions.
    const netPay = Math.round(
      Math.max(
        entry.grossPay + additionalPay - cashAdvance - entry.deductions,
        0
      ) * 100
    ) / 100;

    const updatedEntry: PayrollEntry = {
      ...entry,
      cashAdvance,
      additionalPay,
      disbursement,
      remarks,
      chargedTo,
      netPay,
    };

    setPendingId(entry.id);
    setActiveEntries((prev) =>
      prev.map((item) => (item.id === entry.id ? updatedEntry : item))
    );
    savePayrollEntryPreview(updatedEntry);

    if (editingId === entry.id) {
      setForm((current) => ({
        ...current,
        cashAdvance: String(cashAdvance),
        additionalPay: String(additionalPay),
        disbursement,
        remarks,
        chargedTo,
      }));
    }

    startTransition(async () => {
      const result = await updatePayrollEntry(entry.id, {
        hours: updatedEntry.hours,
        overtime_hours: updatedEntry.overtimeHours,
        regular_pay: updatedEntry.regularPay,
        overtime_pay: updatedEntry.overtimePay,
        gross_pay: updatedEntry.grossPay,
        cash_advance: updatedEntry.cashAdvance,
        additional_pay: updatedEntry.additionalPay,
        deductions: updatedEntry.deductions,
        net_pay: updatedEntry.netPay,
        site_assignment: updatedEntry.siteAssignment,
        disbursement: updatedEntry.disbursement,
        remarks: updatedEntry.remarks,
        charged_to: updatedEntry.chargedTo,
        status: updatedEntry.status,
      });

      if (result.error) {
        setMessage(result.error);
        setActiveEntries((prev) =>
          prev.map((item) => (item.id === entry.id ? entry : item))
        );
        savePayrollEntryPreview(entry);
      }
      setPendingId(null);
    });
  }

  function handleExcelUpload(file: File | null) {
    if (!file) return;
    setUploading(true);
    setMessage(null);
    const uploadTab: PayrollTab =
      dataTab === "admin" ? "admin" : "construction";
    const preferredPeriodKey =
      uploadTab === "admin" ? adminPeriod.key : constructionPeriod.key;

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("preferredPeriodKey", preferredPeriodKey);

        const result =
          uploadTab === "admin"
            ? await importAdminPayrollExcel(formData)
            : await importConstructionPayrollExcel(formData);

        if (result.error) {
          setMessage(result.error);
          return;
        }

        if (result.entries && result.periodKey) {
          const period = parsePayrollPeriodKey(uploadTab, result.periodKey);
          if (uploadTab === "admin") {
            setAdminEntries(result.entries);
            setAdminPeriod(period);
            setAdminReady(true);
            setActiveTab("admin");
          } else {
            setConstructionEntries(result.entries);
            setConstructionPeriod(period);
            setConstructionReady(true);
            setActiveTab("construction");
          }
        }

        setMessage(
          result.preview
            ? `Preview import: saved ${result.importedCount ?? 0} rows from "${result.sheetName}" for ${result.periodLabel}. (Database not connected — local preview only.)`
            : `Imported ${result.importedCount ?? 0} payable rows from "${result.sheetName}" for ${result.periodLabel}.`
        );
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    });
  }

  function handleExportPayroll() {
    const csv = buildPayrollCsv({
      entries: activeEntries,
      employees,
      payrollAdjustments,
      category: dataTab,
      period: activePeriod,
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const uploadDate = getPayrollUploadDate(dataTab, activePeriod);

    link.href = url;
    link.download = payrollExportFilename(dataTab, activePeriod);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setMessage(
      `${activeMeta.label} payroll for ${activePeriod.label} exported (${uploadDate}).`
    );
  }

  const isBusy = pending || loadingPeriod || uploading;

  return (
    <>
      <div className="payroll-screen">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-sbc-gray">
            Admin
          </p>
          <h1 className="mt-2 text-2xl font-bold text-sbc-gold">Payroll</h1>
          <p className="mt-1 max-w-xl text-sm text-sbc-gray">
            Upload payroll for this session, then print or export. Refreshing the
            page clears the table so you upload again.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isBusy}
            onClick={() => loadPeriod(-1)}
          >
            <ChevronLeftIcon />
            Prev
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
            Next
            <ChevronRightIcon />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isBusy}
            onClick={jumpToCurrentPeriod}
          >
            <CalendarIcon />
            {usesWeeklyPayroll(dataTab) ? "This Week" : "Current"}
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isBusy || uploading}
            onClick={() => {
              fileInputRef.current?.click();
            }}
          >
            <UploadIcon />
            {uploading ? "Uploading…" : "Upload payroll"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => handleExcelUpload(e.target.files?.[0] ?? null)}
          />
        </div>
      </div>

      <p className="mb-4 rounded-lg border border-sbc-gold/25 bg-sbc-gold/5 px-4 py-3 text-sm text-sbc-gray">
        <span className="font-semibold text-sbc-black">
          {activeTab === "admin" ? "Admin · " : "Construction · "}
        </span>
        {activeTab === "admin"
          ? "Upload one Admin payroll workbook. Exports use the 15th or month-end for that cutoff."
          : "Upload one Construction payroll workbook. Sheet tabs (e.g. 7.3.26) are entry dates — the pay period is that week’s Saturday."}
      </p>

      {message && (
        <p className="mb-4 rounded-lg border border-sbc-gold/30 bg-sbc-gold/10 px-4 py-3 text-sm font-semibold text-sbc-black">
          {message}
        </p>
      )}

      <div className="mb-0">
        <div
          role="tablist"
          aria-label="Payroll type"
          className="flex items-end gap-1"
        >
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                disabled={isBusy}
                onClick={() => {
                  setActiveTab(tab.id);
                  resetForm();
                  setMessage(null);
                }}
                className={`-mb-px rounded-t-md border px-3 py-1.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sbc-gold/35 disabled:cursor-not-allowed disabled:opacity-60 ${
                  active
                    ? "border-sbc-gray-light border-b-sbc-white bg-sbc-white text-sbc-black"
                    : "border-transparent bg-sbc-off-white text-sbc-gray hover:bg-sbc-white/80 hover:text-sbc-black"
                }`}
              >
                <span
                  className={`block text-[11px] font-bold uppercase tracking-[0.12em] ${
                    active ? "text-sbc-gold-dark" : ""
                  }`}
                >
                  {tab.label}
                </span>
                <span className="mt-0.5 block text-[10px] font-medium text-sbc-gray">
                  {tab.hint}
                </span>
              </button>
            );
          })}
        </div>

        <div className="rounded-b-lg rounded-tr-lg border border-sbc-gray-light bg-sbc-white p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={activeEntries.filter((e) => e.netPay > 0).length === 0}
              onClick={handleExportPayroll}
            >
              <ExportIcon />
              Export CSV
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={activeEntries.filter((e) => e.netPay > 0).length === 0}
              onClick={() => window.print()}
            >
              <PrintIcon />
              Print Slips
            </Button>
          </div>
          <PayrollTable
            entries={activeEntries}
            category={dataTab}
            period={activePeriod}
            pendingId={pendingId}
            sort={sort}
            disbursementMethods={disbursementMethods}
            onToggleSort={toggleSort}
            onInlineUpdate={handleInlineUpdate}
          />
        </div>
      </div>
      </div>

      <PayrollPrintSheet
        entries={activeEntries}
        category={dataTab}
        period={activePeriod}
        payrollAdjustments={payrollAdjustments}
        employees={employees}
      />
    </>
  );
}
