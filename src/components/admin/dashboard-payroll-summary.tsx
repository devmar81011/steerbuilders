"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { formatCurrency, type PayrollEntry } from "@/lib/mvp-data";
import { mergePayrollEntriesWithPreview } from "@/lib/payroll-preview-storage";
import { payrollTabMeta, type PayrollPeriod, type PayrollTab } from "@/lib/payroll-periods";

type PayrollSnapshot = {
  constructionEntries: PayrollEntry[];
  adminEntries: PayrollEntry[];
  ojtEntries: PayrollEntry[];
  constructionPeriod: PayrollPeriod;
  adminPeriod: PayrollPeriod;
  ojtPeriod: PayrollPeriod;
};

function countPending(entries: { status: string }[]) {
  return entries.filter((entry) => entry.status === "draft").length;
}

const pendingCategories: PayrollTab[] = ["construction", "admin", "ojt"];

function mergeSnapshot(snapshot: PayrollSnapshot): PayrollSnapshot {
  return {
    ...snapshot,
    constructionEntries: mergePayrollEntriesWithPreview(snapshot.constructionEntries),
    adminEntries: mergePayrollEntriesWithPreview(snapshot.adminEntries),
    ojtEntries: mergePayrollEntriesWithPreview(snapshot.ojtEntries),
  };
}

export function DashboardPayrollSummary({
  initialPayroll,
  activeEmployees,
}: {
  initialPayroll: PayrollSnapshot;
  activeEmployees: number;
}) {
  const payroll = useMemo(
    () => mergeSnapshot(initialPayroll),
    [initialPayroll]
  );

  const pendingByCategory = useMemo(
    () => ({
      construction: countPending(payroll.constructionEntries),
      admin: countPending(payroll.adminEntries),
      ojt: countPending(payroll.ojtEntries),
    }),
    [payroll]
  );

  const pendingEntries = useMemo(
    () =>
      [
        ...payroll.constructionEntries,
        ...payroll.adminEntries,
        ...payroll.ojtEntries,
      ]
        .filter((entry) => entry.status === "draft")
        .sort((a, b) => a.employeeName.localeCompare(b.employeeName)),
    [payroll]
  );

  return (
    <>
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-xs font-medium uppercase tracking-widest text-sbc-gray">
            Active Employees
          </p>
          <p className="mt-2 text-2xl font-bold text-sbc-black">{activeEmployees}</p>
        </Card>

        {pendingCategories.map((category) => (
          <Card key={category}>
            <p className="text-xs font-medium uppercase tracking-widest text-sbc-gray">
              Pending · {payrollTabMeta[category].label}
            </p>
            <p className="mt-2 text-2xl font-bold text-sbc-black">
              {pendingByCategory[category]}
            </p>
            <p className="mt-1 text-xs text-sbc-gray">
              {category === "construction"
                ? payroll.constructionPeriod.label
                : category === "admin"
                  ? payroll.adminPeriod.label
                  : payroll.ojtPeriod.label}
            </p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-bold text-sbc-black">Pending Payroll</h2>
          <Link
            href="/admin/payroll"
            className="text-xs font-semibold uppercase tracking-widest text-sbc-gold hover:underline"
          >
            Open payroll →
          </Link>
        </div>

        {pendingEntries.length === 0 ? (
          <p className="mt-4 text-sm text-sbc-gray">
            No draft payroll entries for the current period.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {pendingEntries.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-sbc-gray-light pb-2 text-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{entry.employeeName}</span>
                  <span className="text-xs font-semibold uppercase tracking-widest text-sbc-gray">
                    {payrollTabMeta[entry.category].label}
                  </span>
                </div>
                <span className="font-medium text-sbc-gold">
                  {formatCurrency(entry.netPay)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
