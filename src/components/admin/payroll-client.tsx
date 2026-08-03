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
  getPayrollUploadHistory,
  importAdminPayrollExcel,
  importConstructionPayrollExcel,
  deletePayrollUpload,
  type PayrollUploadHistoryItem,
} from "@/lib/actions/payroll-import";
import {
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
  payrollExportFilename,
} from "@/lib/payroll-export";
import { radii } from "@/lib/design-tokens";
import { IconButton, TrashIcon } from "@/components/ui/icon-button";

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
  initialUploadHistory: PayrollUploadHistoryItem[];
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

type PayrollViewTab = PayrollTab | "uploads";

const tabs: {
  id: PayrollViewTab;
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
  {
    id: "uploads",
    label: "Uploads",
    hint: "Manage files",
  },
];

function displayRemarks(remarks: string): string {
  if (parseAdminPayslipMeta(remarks)) return "—";
  return remarks || "—";
}

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
  if (category === "admin") {
    const pages = chunkEntries(entries, 2);
    return (
      <div className="payroll-print-area">
        {pages.map((pageEntries, pageIndex) => (
          <section
            className="payroll-print-page payroll-print-page-admin"
            key={`${period.key}-admin-${pageIndex}`}
          >
            {pageEntries.map((entry) => {
              const meta = parseAdminPayslipMeta(entry.remarks);
              const basicPay = meta?.basicPay || entry.regularPay;
              const sss = meta?.sss ?? getDeductionAmount(
                resolveEntryDeductionBreakdown(
                  entry,
                  payrollAdjustments,
                  employeeContextFromEntry(entry, employees)
                ),
                "sss"
              );
              const phic = meta?.phic ?? getDeductionAmount(
                resolveEntryDeductionBreakdown(
                  entry,
                  payrollAdjustments,
                  employeeContextFromEntry(entry, employees)
                ),
                "phic"
              );
              const hdmf = meta?.hdmf ?? getDeductionAmount(
                resolveEntryDeductionBreakdown(
                  entry,
                  payrollAdjustments,
                  employeeContextFromEntry(entry, employees)
                ),
                "hdmf"
              );
              const tax = meta?.tax ?? 0;
              const leavePay = meta?.leavePay ?? entry.additionalPay;
              const totalDeductions =
                entry.cashAdvance + sss + phic + hdmf + tax;

              return (
                <article className="payroll-print-admin-slip" key={entry.id}>
                  <header className="payroll-print-admin-header">
                    <p className="payroll-print-eyebrow">Steer Builders Corporation</p>
                    <h2>Payslip</h2>
                    <p>Admin · Semi-monthly payroll</p>
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
                    <div>
                      <dt>Designation</dt>
                      <dd>{entry.designation || "—"}</dd>
                    </div>
                  </dl>

                  <div className="payroll-print-admin-columns">
                    <div>
                      <h3>Earnings</h3>
                      <dl className="payroll-print-lines">
                        <div>
                          <dt>Basic Salary</dt>
                          <dd>{formatCurrency(basicPay)}</dd>
                        </div>
                        <div>
                          <dt>Overtime</dt>
                          <dd>{formatCurrency(entry.overtimePay)}</dd>
                        </div>
                        {leavePay > 0 && (
                          <div>
                            <dt>Leave Pay</dt>
                            <dd>{formatCurrency(leavePay)}</dd>
                          </div>
                        )}
                        <div>
                          <dt>Gross Pay</dt>
                          <dd>{formatCurrency(entry.grossPay)}</dd>
                        </div>
                      </dl>
                    </div>
                    <div>
                      <h3>Deductions</h3>
                      <dl className="payroll-print-lines">
                        <div>
                          <dt>Cash Advance</dt>
                          <dd>{formatCurrency(entry.cashAdvance)}</dd>
                        </div>
                        <div>
                          <dt>SSS</dt>
                          <dd>{formatCurrency(sss)}</dd>
                        </div>
                        <div>
                          <dt>PhilHealth</dt>
                          <dd>{formatCurrency(phic)}</dd>
                        </div>
                        <div>
                          <dt>HDMF</dt>
                          <dd>{formatCurrency(hdmf)}</dd>
                        </div>
                        {tax > 0 && (
                          <div>
                            <dt>Tax</dt>
                            <dd>{formatCurrency(tax)}</dd>
                          </div>
                        )}
                        <div>
                          <dt>Total Deductions</dt>
                          <dd>{formatCurrency(totalDeductions || entry.deductions + entry.cashAdvance)}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  <div className="payroll-print-net payroll-print-admin-net">
                    <span>Net Pay</span>
                    <strong>{formatCurrency(entry.netPay)}</strong>
                  </div>

                  <div className="payroll-print-signatures">
                    <span>Approved by</span>
                    <span>Received by</span>
                  </div>
                </article>
              );
            })}
          </section>
        ))}
      </div>
    );
  }

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
                  {entry.remarks && !parseAdminPayslipMeta(entry.remarks) && (
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
  const columnCount = 16;

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

      <TableShell minWidth="2400px" scrollable className="rounded-none border-0">
        <Table>
          <TableHeader>
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
          </TableHeader>
          <TableBody>
            {sortedEntries.length === 0 ? (
              <TableEmpty
                colSpan={columnCount}
                message={`No uploaded ${category} payroll for this period yet. Upload an Excel file to load payslips.`}
              />
            ) : (
              sortedEntries.map((entry) => {
                const rowBusy = pendingId === entry.id;
                const disbursementOptions = Array.from(
                  new Set(
                    [...disbursementMethods, entry.disbursement].filter(Boolean)
                  )
                );

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
                    <TableCell>
                      {parseAdminPayslipMeta(entry.remarks) ? (
                        displayRemarks(entry.remarks)
                      ) : (
                        <InlineTextField
                          value={entry.remarks || ""}
                          disabled={rowBusy}
                          className="min-w-[120px]"
                          onCommit={(value) =>
                            onInlineUpdate(entry, "remarks", value)
                          }
                        />
                      )}
                    </TableCell>
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
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        <TableMeta>
          <span>{entries.length} employees</span>
          <span className="text-sbc-gold">
            Net total · {formatCurrency(totalNet)}
          </span>
        </TableMeta>
      </TableShell>
    </>
  );
}

function formatUploadedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function UploadsPanel({
  uploads,
  busy,
  filter,
  onFilterChange,
  onOpen,
  onDelete,
  onReplace,
}: {
  uploads: PayrollUploadHistoryItem[];
  busy: boolean;
  filter: "all" | PayrollTab;
  onFilterChange: (filter: "all" | PayrollTab) => void;
  onOpen: (item: PayrollUploadHistoryItem) => void;
  onDelete: (item: PayrollUploadHistoryItem) => void;
  onReplace: (item: PayrollUploadHistoryItem) => void;
}) {
  const filtered =
    filter === "all"
      ? uploads
      : uploads.filter((item) => item.category === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-sbc-gold">
            Saved uploads
          </p>
          <p className="mt-1 text-sm text-sbc-gray">
            Open a period, replace a wrong file, or delete an upload.
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {(
            [
              ["all", "All"],
              ["construction", "Construction"],
              ["admin", "Admin"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              disabled={busy}
              onClick={() => onFilterChange(id)}
              className={`rounded-md px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] transition-colors ${
                filter === id
                  ? "bg-sbc-gold/15 text-sbc-gold-dark"
                  : "text-sbc-gray hover:bg-sbc-off-white hover:text-sbc-black"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <TableShell minWidth="900px" scrollable className="rounded-none border-0">
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Type</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>File</TableHead>
              <TableHead align="right">Rows</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead align="right">Actions</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableEmpty
                colSpan={6}
                message="No uploads yet. Use Upload Excel on Construction or Admin first."
              />
            ) : (
              filtered.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <span className="text-xs font-semibold uppercase tracking-widest text-sbc-gold-dark">
                      {item.category}
                    </span>
                  </TableCell>
                  <TablePrimaryCell>{item.periodLabel}</TablePrimaryCell>
                  <TableCell>
                    <span className="block max-w-[220px] truncate" title={item.filename}>
                      {item.filename}
                    </span>
                    {item.sheetName ? (
                      <span className="mt-0.5 block text-[11px] text-sbc-gray">
                        {item.sheetName}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell align="right" numeric>
                    {item.rowCount}
                  </TableCell>
                  <TableCell>{formatUploadedAt(item.uploadedAt)}</TableCell>
                  <TableCell align="right">
                    <div className="flex flex-wrap items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onClick={() => onOpen(item)}
                      >
                        Open
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={busy}
                        onClick={() => onReplace(item)}
                      >
                        <UploadIcon />
                        Replace
                      </Button>
                      <IconButton
                        label={`Delete ${item.periodLabel}`}
                        variant="danger"
                        size="sm"
                        disabled={busy}
                        onClick={() => onDelete(item)}
                      >
                        <TrashIcon />
                      </IconButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TableMeta>
          <span>
            {filtered.length} saved upload{filtered.length === 1 ? "" : "s"}
          </span>
        </TableMeta>
      </TableShell>
    </div>
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
  initialUploadHistory,
}: Props) {
  const [activeTab, setActiveTab] = useState<PayrollViewTab>("construction");
  const [lastPayrollTab, setLastPayrollTab] =
    useState<PayrollTab>("construction");
  const [uploadsFilter, setUploadsFilter] = useState<"all" | PayrollTab>("all");
  // Upload-first: show only saved Excel payslips — do not invent rows from attendance.
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
  const [uploadHistory, setUploadHistory] = useState(initialUploadHistory);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceCategoryRef = useRef<PayrollTab | null>(null);
  const [pending, startTransition] = useTransition();
  const { sort, toggleSort } = useTableSort<PayrollSortKey>({
    defaultKey: "employeeName",
  });

  const isUploadsTab = activeTab === "uploads";
  const dataTab: PayrollTab =
    activeTab === "admin"
      ? "admin"
      : activeTab === "ojt"
        ? "ojt"
        : lastPayrollTab === "admin"
          ? "admin"
          : "construction";

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

  function loadPeriod(direction: -1 | 1) {
    if (isUploadsTab) return;
    setLoadingPeriod(true);
    setMessage(null);
    resetForm();

    const nextPeriod = shiftPayrollPeriod(dataTab, activePeriod, direction);

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
    if (isUploadsTab) return;
    setLoadingPeriod(true);
    setMessage(null);
    resetForm();

    const current = getCurrentPayrollPeriod(dataTab);

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

    const amounts = calculatePayrollAmounts({
      hourlyRate: entry.hourlyRate,
      regularHours: entry.hours,
      overtimeHours: entry.overtimeHours,
      otPayPercent,
      cashAdvance,
      additionalPay,
      statutoryDeductions: entry.deductions,
    });

    const updatedEntry: PayrollEntry = {
      ...entry,
      cashAdvance,
      additionalPay,
      disbursement,
      remarks,
      chargedTo,
      regularPay: amounts.regularPay,
      overtimePay: amounts.overtimePay,
      grossPay: amounts.grossPay,
      netPay: amounts.netPay,
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

  function loadPeriodByKey(periodKey: string, tab: PayrollTab) {
    setLoadingPeriod(true);
    setMessage(null);
    resetForm();

    startTransition(async () => {
      try {
        const result = await getPayrollForPeriod(tab, periodKey);
        applyPeriodResult(tab, result);
        setLastPayrollTab(tab);
        setActiveTab(tab);
      } finally {
        setLoadingPeriod(false);
      }
    });
  }

  function handleExcelUpload(file: File | null) {
    if (!file) return;
    setUploading(true);
    setMessage(null);
    const uploadTab =
      replaceCategoryRef.current ??
      (activeTab === "admin"
        ? "admin"
        : activeTab === "uploads"
          ? lastPayrollTab === "admin"
            ? "admin"
            : "construction"
          : dataTab === "admin"
            ? "admin"
            : "construction");
    replaceCategoryRef.current = null;

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("file", file);
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
            setLastPayrollTab("admin");
            setActiveTab("admin");
          } else {
            setConstructionEntries(result.entries);
            setConstructionPeriod(period);
            setLastPayrollTab("construction");
            setActiveTab("construction");
          }
        }

        const history = await getPayrollUploadHistory();
        setUploadHistory(history);

        setMessage(
          result.preview
            ? `Preview import: saved ${result.importedCount ?? 0} rows from "${result.sheetName}" for ${result.periodLabel}. (Database not connected — local preview only.)`
            : `Imported ${result.importedCount ?? 0} rows from "${result.sheetName}" for ${result.periodLabel}. Saved for history — you can print or export anytime.`
        );
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    });
  }

  function handleDeleteUpload(item: PayrollUploadHistoryItem) {
    const confirmed = window.confirm(
      `Delete ${item.category} payroll for ${item.periodLabel}?\n\nThis removes the saved payslips so you can upload the correct Excel file.`
    );
    if (!confirmed) return;

    setLoadingPeriod(true);
    setMessage(null);

    startTransition(async () => {
      try {
        const result = await deletePayrollUpload(item.id);
        if (result.error) {
          setMessage(result.error);
          return;
        }

        const history = await getPayrollUploadHistory();
        setUploadHistory(history);

        if (result.periodKey && result.category) {
          const refreshed = await getPayrollForPeriod(
            result.category,
            result.periodKey
          );
          applyPeriodResult(result.category, refreshed);
        }

        setMessage(
          `Deleted ${item.category} payroll for ${item.periodLabel}. Upload the correct Excel anytime.`
        );
      } finally {
        setLoadingPeriod(false);
      }
    });
  }

  function handleReplaceUpload(item: PayrollUploadHistoryItem) {
    const category = item.category === "admin" ? "admin" : "construction";
    replaceCategoryRef.current = category;
    setLastPayrollTab(category);
    setMessage(
      `Choose a replacement ${category} Excel for ${item.periodLabel}. Existing rows for that period will be overwritten.`
    );
    fileInputRef.current?.click();
  }

  function handleExportPayroll() {
    if (isUploadsTab) return;
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

    link.href = url;
    link.download = payrollExportFilename(dataTab, activePeriod);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setMessage(
      `${activeMeta.label} payroll for ${activePeriod.label} exported successfully.`
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
            Upload completed Excel payroll, save it for history, then print or export.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isBusy || isUploadsTab}
            onClick={() => loadPeriod(-1)}
          >
            <ChevronLeftIcon />
            Prev
          </Button>
          <span className="min-w-[140px] text-center text-sm font-medium text-sbc-black">
            {isUploadsTab ? "Uploads" : activePeriod.label}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isBusy || isUploadsTab}
            onClick={() => loadPeriod(1)}
          >
            Next
            <ChevronRightIcon />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isBusy || isUploadsTab}
            onClick={jumpToCurrentPeriod}
          >
            <CalendarIcon />
            {usesWeeklyPayroll(dataTab) ? "This Week" : "Current"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => handleExcelUpload(e.target.files?.[0] ?? null)}
          />
          <Button
            type="button"
            size="sm"
            disabled={isBusy || uploading || isUploadsTab}
            onClick={() => {
              replaceCategoryRef.current = null;
              fileInputRef.current?.click();
            }}
          >
            <UploadIcon />
            {uploading ? "Uploading…" : "Upload Excel"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isUploadsTab || activeEntries.length === 0}
            onClick={handleExportPayroll}
          >
            <ExportIcon />
            Export
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isUploadsTab || activeEntries.length === 0}
            onClick={() => window.print()}
          >
            <PrintIcon />
            Print
          </Button>
        </div>
      </div>

      <p className="mb-4 rounded-lg border border-sbc-gold/25 bg-sbc-gold/5 px-4 py-3 text-sm text-sbc-gray">
        <span className="font-semibold text-sbc-black">
          {isUploadsTab
            ? "Uploads · "
            : activeTab === "admin"
              ? "Admin · "
              : "Construction · "}
        </span>
        {isUploadsTab
          ? "Review saved Excel imports. Open a period, replace a wrong file, or delete it and upload again."
          : activeTab === "admin"
            ? "Upload the Admin workbook (Payroll Computation). Print uses the Excel Payslip layout."
            : "Upload the Operations weekly Excel. The table stays empty until you upload."}
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
                  if (tab.id === "construction" || tab.id === "admin") {
                    setLastPayrollTab(tab.id);
                  }
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
          {isUploadsTab ? (
            <UploadsPanel
              uploads={uploadHistory}
              busy={isBusy}
              filter={uploadsFilter}
              onFilterChange={setUploadsFilter}
              onOpen={(item) => {
                const tab = item.category === "admin" ? "admin" : "construction";
                loadPeriodByKey(item.periodKey, tab);
              }}
              onDelete={handleDeleteUpload}
              onReplace={handleReplaceUpload}
            />
          ) : (
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
          )}
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
