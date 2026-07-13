"use client";

import { useMemo, useState, useTransition } from "react";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import { sortRows, useTableSort } from "@/lib/table-sort";
import { Card } from "@/components/ui/card";
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
import { createEmployee, updateEmployee } from "@/lib/actions/payroll";
import {
  TableEditButton,
  TableRowActions,
} from "@/components/admin/table-row-actions";
import {
  employeeCategories,
  formatEmployeeCategory,
  getCategoryLabelClass,
  getRolesForCategory,
  type EmployeeCategory,
} from "@/lib/employee-categories";
import {
  findDailyRate,
  type DailyRate,
} from "@/lib/daily-rates";
import { formatCurrency, type Employee } from "@/lib/mvp-data";
import { formatRateAmount } from "@/lib/rate-types";

type Props = {
  employees: Employee[];
  dailyRates: DailyRate[];
};

type EmployeeSortKey = "name" | "category" | "role" | "rate" | "status";

export function EmployeesClient({ employees: initialEmployees, dailyRates }: Props) {
  const [employees, setEmployees] = useState(initialEmployees);
  const { sort, toggleSort } = useTableSort<EmployeeSortKey>({ defaultKey: "name" });
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const defaultRole = getRolesForCategory("construction")[0];
  const [form, setForm] = useState<{
    name: string;
    category: EmployeeCategory;
    role: string;
    status: "active" | "inactive";
  }>({
    name: "",
    category: "construction",
    role: defaultRole,
    status: "active",
  });

  const roleOptions = useMemo(
    () => getRolesForCategory(form.category),
    [form.category]
  );

  const selectedRate = findDailyRate(dailyRates, form.category, form.role);

  const sortedEmployees = useMemo(
    () =>
      sortRows(employees, sort, (row, key) => {
        if (key === "rate") return row.rate;
        return row[key];
      }),
    [employees, sort]
  );

  function handleCategoryChange(category: EmployeeCategory) {
    const roles = getRolesForCategory(category);
    setForm({ ...form, category, role: roles[0] });
  }

  function resetForm() {
    setEditingId(null);
    setForm({
      name: "",
      category: "construction",
      role: getRolesForCategory("construction")[0],
      status: "active",
    });
  }

  function startEdit(emp: Employee) {
    setEditingId(emp.id);
    setForm({
      name: emp.name,
      category: emp.category,
      role: emp.role,
      status: emp.status,
    });
    setMessage(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedRate) {
      setMessage("Add this category and role in Daily Rates first.");
      return;
    }

    startTransition(async () => {
      const payload = {
        name: form.name,
        category: form.category,
        role: form.role,
        rate: selectedRate.rate,
        rate_type: selectedRate.rateType,
        status: form.status,
      };

      const result = editingId
        ? await updateEmployee(editingId, payload)
        : await createEmployee({
            name: form.name,
            category: form.category,
            role: form.role,
            rate: selectedRate.rate,
            rate_type: selectedRate.rateType,
          });

      if (result.error) {
        setMessage(result.error);
        return;
      }

      if (editingId) {
        setEmployees((prev) =>
          prev.map((emp) =>
            emp.id === editingId
              ? {
                  ...emp,
                  name: form.name,
                  category: form.category,
                  role: form.role as Employee["role"],
                  rate: selectedRate.rate,
                  rateType: selectedRate.rateType,
                  status: form.status,
                }
              : emp
          )
        );
        setMessage("Employee updated.");
      } else {
        const newId =
          "id" in result && typeof result.id === "string"
            ? result.id
            : `emp-${Date.now()}`;
        setEmployees((prev) => [
          ...prev,
          {
            id: newId,
            name: form.name,
            category: form.category,
            role: form.role as Employee["role"],
            rate: selectedRate.rate,
            rateType: selectedRate.rateType,
            status: "active",
          },
        ]);
        setMessage("Employee added.");
      }

      resetForm();
    });
  }

  return (
    <>
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest text-sbc-gray">
          Admin
        </p>
        <h1 className="mt-2 text-2xl font-bold text-sbc-gold">Employees</h1>
        <p className="mt-2 text-sm font-semibold text-sbc-gray">
          Add workers by category and role — rates come from Daily Rates.
        </p>
      </div>

      {message && (
        <p className="mb-6 rounded-lg border border-sbc-gold/30 bg-sbc-gold/10 px-4 py-3 text-sm font-semibold text-sbc-black">
          {message}
        </p>
      )}

      <Card className="mb-8">
        <p className="mb-4 text-xs font-medium uppercase tracking-widest text-sbc-gold">
          {editingId ? "Edit Employee" : "Add Employee"}
        </p>
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <Input
            label="Full Name"
            size="sm"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />

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

          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium uppercase tracking-widest text-sbc-gray">
              Rate (from Daily Rates)
            </p>
            <p className="rounded-lg border border-sbc-gray-light bg-sbc-off-white px-3 py-2 text-sm font-medium text-sbc-black">
              {selectedRate
                ? formatRateAmount(selectedRate.rate, selectedRate.rateType)
                : "—"}
            </p>
          </div>

          {editingId && (
            <Select
              label="Status"
              size="sm"
              value={form.status}
              onChange={(e) =>
                setForm({
                  ...form,
                  status: e.target.value as "active" | "inactive",
                })
              }
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          )}

          <div className="md:col-span-2 flex flex-wrap gap-3">
            <Button type="submit" size="sm" disabled={pending || !selectedRate}>
              {editingId ? "Update Employee" : "+ Add Employee"}
            </Button>
            {editingId && (
              <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card>

      <TableShell minWidth="880px" scrollable>
        <Table>
          <TableHeader>
            <tr>
              <SortableTableHead
                sortKey="name"
                activeKey={sort.key}
                direction={sort.direction}
                onSort={(key) => toggleSort(key as EmployeeSortKey)}
              >
                Name
              </SortableTableHead>
              <SortableTableHead
                sortKey="category"
                activeKey={sort.key}
                direction={sort.direction}
                onSort={(key) => toggleSort(key as EmployeeSortKey)}
              >
                Category
              </SortableTableHead>
              <SortableTableHead
                sortKey="role"
                activeKey={sort.key}
                direction={sort.direction}
                onSort={(key) => toggleSort(key as EmployeeSortKey)}
              >
                Role
              </SortableTableHead>
              <SortableTableHead
                sortKey="rate"
                activeKey={sort.key}
                direction={sort.direction}
                onSort={(key) => toggleSort(key as EmployeeSortKey)}
              >
                Rate
              </SortableTableHead>
              <SortableTableHead
                sortKey="status"
                align="right"
                activeKey={sort.key}
                direction={sort.direction}
                onSort={(key) => toggleSort(key as EmployeeSortKey)}
              >
                Status
              </SortableTableHead>
              <TableHead align="right">Actions</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {sortedEmployees.map((emp) => (
              <TableRow key={emp.id}>
                <TablePrimaryCell>{emp.name}</TablePrimaryCell>
                <TableCell>
                  <span
                    className={`text-xs font-semibold uppercase tracking-widest ${getCategoryLabelClass(emp.category)}`}
                  >
                    {formatEmployeeCategory(emp.category)}
                  </span>
                </TableCell>
                <TableCell className="!text-sbc-gray">{emp.role}</TableCell>
                <TableCell numeric className="!font-semibold !text-sbc-black">
                  {formatRateAmount(emp.rate, emp.rateType)}
                </TableCell>
                <TableCell align="right">
                  <span
                    className={`text-xs font-semibold uppercase tracking-widest ${
                      emp.status === "active" ? "text-sbc-gold" : "text-sbc-gray"
                    }`}
                  >
                    {emp.status}
                  </span>
                </TableCell>
                <TableCell align="right">
                  <TableRowActions>
                    <TableEditButton onClick={() => startEdit(emp)} />
                  </TableRowActions>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TableMeta>
          <span>{employees.length} employees</span>
          <span className="text-sbc-gold">{"Construction & Admin roster"}</span>
        </TableMeta>
      </TableShell>
    </>
  );
}
