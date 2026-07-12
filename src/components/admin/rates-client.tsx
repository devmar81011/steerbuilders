"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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
import { createDailyRate, deleteDailyRate } from "@/lib/actions/rates";
import {
  employeeCategories,
  formatEmployeeCategory,
  getRolesForCategory,
  type EmployeeCategory,
} from "@/lib/employee-categories";
import { formatCurrency } from "@/lib/mvp-data";
import { type DailyRate } from "@/lib/daily-rates";

type Props = {
  initialRates: DailyRate[];
};

export function RatesClient({ initialRates }: Props) {
  const [rates, setRates] = useState(initialRates);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const constructionRoles = getRolesForCategory("construction");
  const [form, setForm] = useState<{
    category: EmployeeCategory;
    role: string;
    rate: string;
    rateType: "hourly" | "salary";
  }>({
    category: "construction",
    role: constructionRoles[0],
    rate: "",
    rateType: "hourly",
  });

  const roleOptions = getRolesForCategory(form.category);

  function handleCategoryChange(category: EmployeeCategory) {
    const roles = getRolesForCategory(category);
    setForm({
      ...form,
      category,
      role: roles[0],
      rateType: category === "admin" ? "salary" : "hourly",
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createDailyRate({
        category: form.category,
        role: form.role,
        rate: Number(form.rate),
        rate_type: form.rateType,
      });

      if (result.error) {
        setMessage(result.error);
        return;
      }

      const newRate: DailyRate = {
        id: `rate-${Date.now()}`,
        category: form.category,
        role: form.role,
        rate: Number(form.rate),
        rateType: form.rateType,
      };

      setRates((prev) => [...prev, newRate]);
      setMessage("Rate added.");
      setForm({
        category: "construction",
        role: constructionRoles[0],
        rate: "",
        rateType: "hourly",
      });
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deleteDailyRate(id);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setRates((prev) => prev.filter((r) => r.id !== id));
      setMessage("Rate removed.");
    });
  }

  return (
    <>
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest text-sbc-gray">
          Admin
        </p>
        <h1 className="mt-2 text-2xl font-bold text-sbc-gold">Daily Rates</h1>
        <p className="mt-2 text-sm font-semibold text-sbc-gray">
          Set pay rates by category and role. Employees inherit rates automatically.
        </p>
      </div>

      {message && (
        <p className="mb-6 border border-sbc-gold/30 bg-sbc-gold/10 px-4 py-3 text-sm font-semibold text-sbc-black">
          {message}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="mb-8 grid gap-4 border border-sbc-gray-light bg-sbc-white p-6 md:grid-cols-2"
      >
        <p className="md:col-span-2 text-xs font-medium uppercase tracking-widest text-sbc-gold">
          Add Rate
        </p>
        <Select
          label="Category"
          size="sm"
          value={form.category}
          onChange={(e) =>
            handleCategoryChange(e.target.value as EmployeeCategory)
          }
        >
          {Object.entries(employeeCategories).map(([key, value]) => (
            <option key={key} value={key}>
              {value.label}
            </option>
          ))}
        </Select>
        <Select
          label="Role"
          size="sm"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          required
        >
          {roleOptions.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </Select>
        <Input
          label="Rate (PHP)"
          size="sm"
          type="number"
          value={form.rate}
          onChange={(e) => setForm({ ...form, rate: e.target.value })}
          placeholder={form.rateType === "hourly" ? "450" : "55000"}
          required
        />
        <Select
          label="Rate Type"
          size="sm"
          value={form.rateType}
          onChange={(e) =>
            setForm({ ...form, rateType: e.target.value as "hourly" | "salary" })
          }
        >
          <option value="hourly">Hourly / Daily</option>
          <option value="salary">Monthly Salary</option>
        </Select>
        <div className="md:col-span-2">
          <Button type="submit" size="sm" disabled={pending}>
            Add Rate
          </Button>
        </div>
      </form>

      <TableShell minWidth="720px" scrollable>
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Category</TableHead>
              <TableHead>Role</TableHead>
              <TableHead align="right">Rate</TableHead>
              <TableHead align="right">Actions</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {rates.map((rate) => (
              <TableRow key={rate.id}>
                <TableCell>
                  <Badge variant={rate.category === "construction" ? "dark" : "gold"}>
                    {formatEmployeeCategory(rate.category)}
                  </Badge>
                </TableCell>
                <TablePrimaryCell>{rate.role}</TablePrimaryCell>
                <TableCell align="right" numeric className="!font-semibold !text-sbc-black">
                  {rate.rateType === "hourly"
                    ? `${formatCurrency(rate.rate)}/day`
                    : `${formatCurrency(rate.rate)}/mo`}
                </TableCell>
                <TableCell align="right">
                  <button
                    type="button"
                    onClick={() => handleDelete(rate.id)}
                    className="text-xs font-semibold uppercase tracking-widest text-sbc-gray transition-colors hover:text-sbc-gold-dark"
                  >
                    Remove
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TableMeta>
          <span>{rates.length} rate entries</span>
          <span className="text-sbc-gold">Used when adding employees</span>
        </TableMeta>
      </TableShell>
    </>
  );
}
