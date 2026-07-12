"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableMeta,
  TablePrimaryCell,
  TableRow,
  TableShell,
} from "@/components/ui/table";
import { formatCurrency, type PayrollEntry } from "@/lib/mvp-data";

type Props = {
  initialEntries: PayrollEntry[];
  period: string;
};

export function PayrollClient({ initialEntries, period }: Props) {
  const [entries, setEntries] = useState(initialEntries);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const totalGross = useMemo(
    () => entries.reduce((s, p) => s + p.grossPay, 0),
    [entries]
  );
  const totalNet = useMemo(
    () => entries.reduce((s, p) => s + p.netPay, 0),
    [entries]
  );

  function handleProcess(id: string) {
    setPendingId(id);
    startTransition(() => {
      setEntries((prev) =>
        prev.map((entry) =>
          entry.id === id ? { ...entry, status: "processed" as const } : entry
        )
      );
      setPendingId(null);
    });
  }

  return (
    <>
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest text-sbc-gray">
          Admin
        </p>
        <h1 className="mt-2 text-2xl font-bold text-sbc-gold">Payroll</h1>
        <p className="mt-1 text-sm font-semibold text-sbc-gray">Period: {period}</p>
      </div>

      <div className="mb-6 flex flex-wrap gap-8 text-sm">
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

      <TableShell minWidth="980px" scrollable>
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Employee</TableHead>
              <TableHead align="center">Hours</TableHead>
              <TableHead align="right">Gross</TableHead>
              <TableHead align="right">Deductions</TableHead>
              <TableHead align="right">Net Pay</TableHead>
              <TableHead align="right">Status</TableHead>
              <TableHead align="right">Action</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TablePrimaryCell>{entry.employeeName}</TablePrimaryCell>
                <TableCell align="center" numeric>
                  {entry.hours}h
                </TableCell>
                <TableCell align="right" numeric className="!font-semibold !text-sbc-black">
                  {formatCurrency(entry.grossPay)}
                </TableCell>
                <TableCell align="right" numeric className="!text-sbc-gray">
                  {formatCurrency(entry.deductions)}
                </TableCell>
                <TableCell align="right" numeric className="!font-bold !text-sbc-gold">
                  {formatCurrency(entry.netPay)}
                </TableCell>
                <TableCell align="right">
                  <Badge variant={entry.status === "processed" ? "gold" : "light"}>
                    {entry.status}
                  </Badge>
                </TableCell>
                <TableCell align="right">
                  {entry.status === "draft" ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleProcess(entry.id)}
                      disabled={pendingId === entry.id}
                    >
                      Process
                    </Button>
                  ) : (
                    <span className="text-xs font-medium text-sbc-gray">Done</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TableMeta>
          <span>{entries.length} employees</span>
          <span className="text-sbc-gold">Net total · {formatCurrency(totalNet)}</span>
        </TableMeta>
      </TableShell>
    </>
  );
}
