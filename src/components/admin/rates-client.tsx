"use client";

import { useState, useTransition, useMemo } from "react";
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
  TableMeta,
  TablePrimaryCell,
  TableRow,
  TableShell,
} from "@/components/ui/table";
import { createDailyRate, deleteDailyRate, updateDailyRate } from "@/lib/actions/rates";
import {
  TableEditButton,
  TableDeleteButton,
  TableRowActions,
} from "@/components/admin/table-row-actions";
import {
  employeeCategories,
  formatEmployeeCategory,
  getCategoryLabelClass,
  getRolesForCategory,
  type EmployeeCategory,
} from "@/lib/employee-categories";
import { type DailyRate } from "@/lib/daily-rates";
import {
  defaultRateTypeForCategory,
  formatRateAmount,
  formatRateTypeLabel,
  type RateType,
} from "@/lib/rate-types";

type Props = {
  initialRates: DailyRate[];
};

type RateSortKey = "category" | "role" | "rate";

export function RatesClient({ initialRates }: Props) {
  const [rates, setRates] = useState(initialRates);
  const { sort, toggleSort } = useTableSort<RateSortKey>({ defaultKey: "category" });
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const constructionRoles = getRolesForCategory("construction");
  const [form, setForm] = useState<{
    category: EmployeeCategory;
    role: string;
    rate: string;
    rateType: RateType;
  }>({
    category: "construction",
    role: constructionRoles[0],
    rate: "",
    rateType: "daily",
  });

  const roleOptions = getRolesForCategory(form.category);

  const sortedRates = useMemo(
    () =>
      sortRows(rates, sort, (row, key) => {
        if (key === "rate") return row.rate;
        if (key === "category") return row.category;
        return row.role;
      }),
    [rates, sort]
  );

  function handleCategoryChange(category: EmployeeCategory) {
    const roles = getRolesForCategory(category);
    setForm({
      ...form,
      category,
      role: roles[0],
      rateType: defaultRateTypeForCategory(category),
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm({
      category: "construction",
      role: constructionRoles[0],
      rate: "",
      rateType: "daily",
    });
  }

  function startEdit(rate: DailyRate) {
    setEditingId(rate.id);
    setForm({
      category: rate.category,
      role: rate.role,
      rate: String(rate.rate),
      rateType: rate.rateType,
    });
    setMessage(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const rateType = defaultRateTypeForCategory(form.category);
      const payload = {
        category: form.category,
        role: form.role,
        rate: Number(form.rate),
        rate_type: rateType,
      };

      const result = editingId
        ? await updateDailyRate(editingId, payload)
        : await createDailyRate(payload);

      if (result.error) {
        setMessage(result.error);
        return;
      }

      if (editingId) {
        setRates((prev) =>
          prev.map((r) =>
            r.id === editingId
              ? {
                  id: editingId,
                  category: form.category,
                  role: form.role,
                  rate: Number(form.rate),
                  rateType,
                }
              : r
          )
        );
        setMessage("Rate updated.");
      } else {
        const newId =
          "id" in result && typeof result.id === "string"
            ? result.id
            : `rate-${Date.now()}`;
        setRates((prev) => [
          ...prev,
          {
            id: newId,
            category: form.category,
            role: form.role,
            rate: Number(form.rate),
            rateType,
          },
        ]);
        setMessage("Rate added.");
      }

      resetForm();
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
        <p className="mb-6 rounded-lg border border-sbc-gold/30 bg-sbc-gold/10 px-4 py-3 text-sm font-semibold text-sbc-black">
          {message}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="mb-8 grid gap-4 rounded-lg border border-sbc-gray-light bg-sbc-white p-6 md:grid-cols-2"
      >
        <p className="md:col-span-2 text-xs font-medium uppercase tracking-widest text-sbc-gold">
          {editingId ? "Edit Rate" : "Add Rate"}
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
          placeholder={
            defaultRateTypeForCategory(form.category) === "daily" ? "450" : "150"
          }
          required
        />
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-widest text-sbc-gray">
            Rate Type
          </p>
          <p className="rounded-lg border border-sbc-gray-light bg-sbc-off-white px-3 py-2 text-sm font-medium text-sbc-black">
            {formatRateTypeLabel(defaultRateTypeForCategory(form.category))}
            <span className="ml-2 text-xs text-sbc-gray">
              ({form.category === "construction" ? "fixed" : "fixed hourly"})
            </span>
          </p>
        </div>
        <div className="md:col-span-2 flex flex-wrap gap-3">
          <Button type="submit" size="sm" disabled={pending}>
            {editingId ? "Update Rate" : "Add Rate"}
          </Button>
          {editingId && (
            <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
              Cancel
            </Button>
          )}
        </div>
      </form>

      <TableShell minWidth="720px" scrollable>
        <Table>
          <TableHeader>
            <tr>
              <SortableTableHead
                sortKey="category"
                activeKey={sort.key}
                direction={sort.direction}
                onSort={(key) => toggleSort(key as RateSortKey)}
              >
                Category
              </SortableTableHead>
              <SortableTableHead
                sortKey="role"
                activeKey={sort.key}
                direction={sort.direction}
                onSort={(key) => toggleSort(key as RateSortKey)}
              >
                Role
              </SortableTableHead>
              <SortableTableHead
                sortKey="rate"
                align="right"
                activeKey={sort.key}
                direction={sort.direction}
                onSort={(key) => toggleSort(key as RateSortKey)}
              >
                Rate
              </SortableTableHead>
              <TableHead align="right">Actions</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {sortedRates.map((rate) => (
              <TableRow key={rate.id}>
                <TableCell>
                  <span
                    className={`text-xs font-semibold uppercase tracking-widest ${getCategoryLabelClass(rate.category)}`}
                  >
                    {formatEmployeeCategory(rate.category)}
                  </span>
                </TableCell>
                <TablePrimaryCell>{rate.role}</TablePrimaryCell>
                <TableCell align="right" numeric className="!font-semibold !text-sbc-black">
                  {formatRateAmount(rate.rate, rate.rateType)}
                </TableCell>
                <TableCell align="right">
                  <TableRowActions>
                    <TableEditButton onClick={() => startEdit(rate)} />
                    <TableDeleteButton
                      label="Remove"
                      onClick={() => handleDelete(rate.id)}
                    />
                  </TableRowActions>
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
