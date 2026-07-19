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
import { createEmployee, deleteEmployee, updateEmployee } from "@/lib/actions/payroll";
import {
  TableDeleteButton,
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
import type { Employee } from "@/lib/mvp-data";
import {
  defaultRateTypeForCategory,
  formatRateAmount,
  type RateType,
} from "@/lib/rate-types";

type Props = {
  employees: Employee[];
  dailyRates: DailyRate[];
};

type EmployeeSortKey =
  | "employeeNumber"
  | "name"
  | "category"
  | "role"
  | "rate"
  | "status";

export function EmployeesClient({ employees: initialEmployees, dailyRates }: Props) {
  const [employees, setEmployees] = useState(initialEmployees);
  const { sort, toggleSort } = useTableSort<EmployeeSortKey>({ defaultKey: "name" });
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const defaultRole = getRolesForCategory("construction")[0];
  const [form, setForm] = useState<{
    employeeNumber: string;
    name: string;
    category: EmployeeCategory;
    role: string;
    rate: string;
    rateType: RateType;
    status: "active" | "inactive";
  }>({
    employeeNumber: "",
    name: "",
    category: "construction",
    role: defaultRole,
    rate:
      String(
        findDailyRate(dailyRates, "construction", defaultRole)?.rate ?? ""
      ),
    rateType:
      findDailyRate(dailyRates, "construction", defaultRole)?.rateType ??
      "daily",
    status: "active",
  });

  const roleOptions = useMemo(
    () => getRolesForCategory(form.category),
    [form.category]
  );

  const roleSuggestion = findDailyRate(dailyRates, form.category, form.role);

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
    const role = roles[0];
    const suggestion = findDailyRate(dailyRates, category, role);
    setForm({
      ...form,
      category,
      role,
      rate: editingId ? form.rate : String(suggestion?.rate ?? ""),
      rateType: editingId
        ? form.rateType
        : suggestion?.rateType ?? defaultRateTypeForCategory(category),
    });
  }

  function handleRoleChange(role: string) {
    const suggestion = findDailyRate(dailyRates, form.category, role);
    setForm({
      ...form,
      role,
      rate: editingId ? form.rate : String(suggestion?.rate ?? ""),
      rateType: editingId
        ? form.rateType
        : suggestion?.rateType ?? defaultRateTypeForCategory(form.category),
    });
  }

  function resetForm() {
    const role = getRolesForCategory("construction")[0];
    const suggestion = findDailyRate(dailyRates, "construction", role);
    setEditingId(null);
    setForm({
      employeeNumber: "",
      name: "",
      category: "construction",
      role,
      rate: String(suggestion?.rate ?? ""),
      rateType: suggestion?.rateType ?? "daily",
      status: "active",
    });
  }

  function startEdit(emp: Employee) {
    setEditingId(emp.id);
    setForm({
      employeeNumber: emp.employeeNumber,
      name: emp.name,
      category: emp.category,
      role: emp.role,
      rate: String(emp.rate),
      rateType: emp.rateType,
      status: emp.status,
    });
    setMessage(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const rate = Number(form.rate);
    if (!Number.isFinite(rate) || rate <= 0) {
      setMessage("Enter an employee rate greater than zero.");
      return;
    }

    startTransition(async () => {
      const payload = {
        employee_number: form.employeeNumber,
        name: form.name,
        category: form.category,
        role: form.role,
        rate,
        rate_type: form.rateType,
        status: form.status,
      };

      const result = editingId
        ? await updateEmployee(editingId, payload)
        : await createEmployee({
            employee_number: form.employeeNumber,
            name: form.name,
            category: form.category,
            role: form.role,
            rate,
            rate_type: form.rateType,
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
                  employeeNumber: form.employeeNumber,
                  name: form.name,
                  category: form.category,
                  role: form.role as Employee["role"],
                  rate,
                  rateType: form.rateType,
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
            employeeNumber: form.employeeNumber,
            name: form.name,
            category: form.category,
            role: form.role as Employee["role"],
            rate,
            rateType: form.rateType,
            status: "active",
          },
        ]);
        setMessage("Employee added.");
      }

      resetForm();
    });
  }

  function handleDelete(id: string, name: string) {
    if (
      !window.confirm(
        `Remove ${name} from the roster? This cannot be undone.`
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await deleteEmployee(id);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setEmployees((prev) => prev.filter((emp) => emp.id !== id));
      if (editingId === id) resetForm();
      setMessage("Employee removed.");
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
          Set each employee&apos;s own pay rate and basis. Role defaults are optional
          suggestions for new employees.
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
            label="Employee Number"
            size="sm"
            value={form.employeeNumber}
            onChange={(e) =>
              setForm({ ...form, employeeNumber: e.target.value })
            }
            required
          />
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
            onChange={(e) => handleRoleChange(e.target.value)}
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
            min="0.01"
            step="0.01"
            value={form.rate}
            onChange={(e) => setForm({ ...form, rate: e.target.value })}
            required
          />

          <Select
            label="Pay Basis"
            size="sm"
            value={form.rateType}
            onChange={(e) =>
              setForm({ ...form, rateType: e.target.value as RateType })
            }
          >
            <option value="daily">Daily</option>
            <option value="monthly">Monthly</option>
            <option value="hourly">Hourly</option>
          </Select>

          {!editingId && (
            <p className="md:col-span-2 text-xs text-sbc-gray">
              {roleSuggestion
                ? `Suggested role default: ${formatRateAmount(roleSuggestion.rate, roleSuggestion.rateType)}. You can override it.`
                : "No role default is configured. Enter this employee’s rate directly."}
            </p>
          )}

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
            <Button type="submit" size="sm" disabled={pending}>
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
                sortKey="employeeNumber"
                activeKey={sort.key}
                direction={sort.direction}
                onSort={(key) => toggleSort(key as EmployeeSortKey)}
              >
                Employee No.
              </SortableTableHead>
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
                <TableCell className="!font-medium !text-sbc-gray">
                  {emp.employeeNumber || "—"}
                </TableCell>
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
                    <TableDeleteButton
                      label="Remove"
                      onClick={() => handleDelete(emp.id, emp.name)}
                      disabled={pending}
                    />
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
