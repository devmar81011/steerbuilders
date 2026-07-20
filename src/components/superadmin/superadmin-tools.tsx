"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import type { ResetCounts, ResetTarget } from "@/lib/superadmin-reset";

const OPTIONS: Array<{
  id: ResetTarget;
  title: string;
  blurb: string;
  danger?: boolean;
}> = [
  {
    id: "attendance",
    title: "Attendance",
    blurb: "Clears construction and admin/OJT attendance weeks.",
  },
  {
    id: "payroll",
    title: "Payroll",
    blurb: "Deletes payroll runs and payslips.",
    danger: true,
  },
  {
    id: "employees",
    title: "Employees",
    blurb:
      "Removes the employee roster. Also clears related attendance and payroll first.",
    danger: true,
  },
  {
    id: "sites",
    title: "Sites",
    blurb: "Deletes project site records from Settings.",
  },
  {
    id: "projects",
    title: "Projects",
    blurb: "Clears public project portfolio records.",
  },
  {
    id: "inquiries",
    title: "Inquiries",
    blurb: "Deletes contact / inquiry submissions.",
  },
];

export function SuperadminTools() {
  const router = useRouter();
  const [counts, setCounts] = useState<ResetCounts | null>(null);
  const [selected, setSelected] = useState<ResetTarget[]>([
    "attendance",
    "payroll",
  ]);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function refreshCounts() {
    const response = await fetch("/api/superadmin/reset");
    const data = await response.json();
    if (!response.ok) {
      setError(data.error || "Could not load counts.");
      return;
    }
    if (data.counts) setCounts(data.counts);
  }

  useEffect(() => {
    refreshCounts().catch(() => undefined);
  }, []);

  function toggle(id: ResetTarget) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function selectAll() {
    setSelected(OPTIONS.map((opt) => opt.id));
  }

  async function onReset() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/superadmin/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targets: selected, confirm }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "Reset failed.");
        setBusy(false);
        return;
      }
      const parts = Object.entries(data.cleared || {}).map(
        ([key, value]) => `${key}: ${value}`
      );
      setMessage(`Cleared — ${parts.join(" · ") || "done"}`);
      setConfirm("");
      await refreshCounts();
      router.refresh();
    } catch {
      setError("Network error — try again.");
    }
    setBusy(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-sbc-gray">
          Clear test data yourself before demos — no need to ask the agent.
          Settings (OT %, disbursement methods, deduction rules) are kept.
          Destructive actions require typing{" "}
          <span className="font-bold text-sbc-black">RESET</span>.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {(
          [
            ["Attendance", counts?.attendance],
            ["Payroll", counts?.payroll],
            ["Employees", counts?.employees],
            ["Sites", counts?.sites],
            ["Projects", counts?.projects],
            ["Inquiries", counts?.inquiries],
          ] as const
        ).map(([label, value]) => (
          <Card key={label} className="!p-4">
            <p className="text-[0.65rem] font-medium uppercase tracking-widest text-sbc-gray">
              {label}
            </p>
            <p className="mt-2 text-2xl font-bold text-sbc-black">
              {value ?? "—"}
            </p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-sbc-gold">
            What to clear
          </h2>
          <Button type="button" variant="ghost" size="sm" onClick={selectAll}>
            Select all
          </Button>
        </div>

        <div className="mt-4 space-y-3">
          {OPTIONS.map((opt) => {
            const checked = selected.includes(opt.id);
            return (
              <label
                key={opt.id}
                className={`flex cursor-pointer gap-3 rounded-lg border px-4 py-3 ${
                  checked
                    ? opt.danger
                      ? "border-red-300 bg-red-50"
                      : "border-sbc-gold/40 bg-sbc-gold/10"
                    : "border-sbc-gray-light bg-sbc-white"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(opt.id)}
                  className="mt-1 h-4 w-4"
                />
                <span>
                  <span
                    className={`block text-sm font-semibold ${
                      opt.danger ? "text-red-800" : "text-sbc-black"
                    }`}
                  >
                    {opt.title}
                  </span>
                  <span className="mt-0.5 block text-sm text-sbc-gray">
                    {opt.blurb}
                  </span>
                </span>
              </label>
            );
          })}
        </div>

        <div className="mt-6 max-w-xs">
          <Input
            label="Type RESET to confirm"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="RESET"
            autoComplete="off"
          />
        </div>

        {error && (
          <p
            role="alert"
            className="mt-4 border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700"
          >
            {error}
          </p>
        )}
        {message && (
          <p className="mt-4 rounded-lg border border-sbc-gold/30 bg-sbc-gold/10 px-3 py-2 text-sm font-semibold text-sbc-black">
            {message}
          </p>
        )}

        <div className="mt-6">
          <Button
            type="button"
            size="sm"
            disabled={busy || selected.length === 0 || confirm !== "RESET"}
            onClick={onReset}
            className="!border-red-400 !bg-red-600 !text-white hover:!bg-red-700 disabled:!opacity-40"
          >
            {busy ? "Resetting…" : "Run reset"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
