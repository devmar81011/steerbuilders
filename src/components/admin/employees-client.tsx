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
  TableEmpty,
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
  getDesignationsForCategory,
  payrollCategories,
  type EmployeeCategory,
} from "@/lib/employee-categories";
import type { Employee } from "@/lib/mvp-data";
import { formatRateAmount } from "@/lib/rate-types";
import type { Site } from "@/lib/actions/sites";

type Props = {
  employees: Employee[];
  sites: Site[];
};

type EmployeeSortKey =
  | "name"
  | "category"
  | "designation"
  | "rate"
  | "status";

export function EmployeesClient({ employees: initialEmployees, sites }: Props) {
  const [employees, setEmployees] = useState(initialEmployees);
  const { sort, toggleSort } = useTableSort<EmployeeSortKey>({ defaultKey: "name" });
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const defaultDesignation = getDesignationsForCategory("construction")[0];
  const [form, setForm] = useState<{
    name: string;
    category: EmployeeCategory;
    designation: string;
    rate: string;
    status: "active" | "inactive";
    assignedSite: string;
  }>({
    name: "",
    category: "construction",
    designation: defaultDesignation,
    rate: "",
    status: "active",
    assignedSite: "",
  });

  const designationOptions = useMemo(
    () => getDesignationsForCategory(form.category),
    [form.category]
  );

  const sortedEmployees = useMemo(
    () =>
      sortRows(employees, sort, (row, key) => {
        if (key === "rate") return row.rate;
        return row[key];
      }),
    [employees, sort]
  );

  const employeesByCategory = useMemo(() => {
    return payrollCategories
      .map((category) => ({
        category,
        label: formatEmployeeCategory(category),
        rows: sortedEmployees.filter((employee) => employee.category === category),
      }))
      .filter((group) => group.rows.length > 0);
  }, [sortedEmployees]);

  function handleCategoryChange(category: EmployeeCategory) {
    const designations = getDesignationsForCategory(category);
    setForm({
      ...form,
      category,
      designation: designations[0],
    });
  }

  function handleDesignationChange(designation: string) {
    setForm({ ...form, designation });
  }

  function resetForm() {
    setEditingId(null);
    setForm({
      name: "",
      category: "construction",
      designation: getDesignationsForCategory("construction")[0],
      rate: "",
      status: "active",
      assignedSite: "",
    });
  }

  function startEdit(emp: Employee) {
    setEditingId(emp.id);
    setForm({
      name: emp.name,
      category: emp.category,
      designation: emp.designation,
      rate: String(emp.rate),
      status: emp.status,
      assignedSite: emp.assignedSite || "",
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
        name: form.name,
        category: form.category,
        designation: form.designation,
        rate,
        rate_type: "hourly" as const,
        status: form.status,
        assigned_site: form.assignedSite.trim(),
      };

      const result = editingId
        ? await updateEmployee(editingId, payload)
        : await createEmployee({
            name: form.name,
            category: form.category,
            designation: form.designation,
            rate,
            rate_type: "hourly",
            assigned_site: form.assignedSite.trim(),
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
                  designation: form.designation as Employee["designation"],
                  rate,
                  rateType: "hourly",
                  status: form.status,
                  assignedSite: form.assignedSite.trim(),
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
            employeeNumber: "",
            name: form.name,
            category: form.category,
            designation: form.designation as Employee["designation"],
            rate,
            rateType: "hourly",
            status: "active",
            assignedSite: form.assignedSite.trim(),
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
          Set each employee&apos;s hourly rate. Payment basis is hourly for
          everyone — payroll uses the rate saved here.
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
            label="Designation"
            size="sm"
            value={form.designation}
            onChange={(e) => handleDesignationChange(e.target.value)}
            required
          >
            {designationOptions.map((designation) => (
              <option key={designation} value={designation}>
                {designation}
              </option>
            ))}
          </Select>

          <Select
            label="Assigned Site"
            size="sm"
            value={form.assignedSite}
            onChange={(e) => setForm({ ...form, assignedSite: e.target.value })}
          >
            <option value="">Not assigned</option>
            {sites
              .filter((site) => site.status === "active")
              .map((site) => (
                <option key={site.id} value={site.name}>
                  {site.name}
                </option>
              ))}
          </Select>

          <div>
            <Input
              label="Hourly Rate (PHP)"
              size="sm"
              type="number"
              min="0.01"
              step="0.01"
              value={form.rate}
              onChange={(e) => setForm({ ...form, rate: e.target.value })}
              required
            />
            <p className="mt-1.5 text-xs font-medium text-sbc-gray">
              Payment basis is hourly for all employees.
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

      <div className="space-y-8">
        {employeesByCategory.length === 0 ? (
          <TableShell minWidth="880px" scrollable>
            <Table>
              <TableBody>
                <TableEmpty
                  colSpan={8}
                  message="No employees yet. Add the first employee above."
                />
              </TableBody>
            </Table>
          </TableShell>
        ) : (
          employeesByCategory.map((group) => (
            <div key={group.category}>
              <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                  <p
                    className={`text-xs font-semibold uppercase tracking-widest ${getCategoryLabelClass(group.category)}`}
                  >
                    {group.label}
                  </p>
                  <p className="mt-1 text-sm text-sbc-gray">
                    {group.rows.length} employee
                    {group.rows.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>

              <TableShell minWidth="800px" scrollable>
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
                        sortKey="designation"
                        activeKey={sort.key}
                        direction={sort.direction}
                        onSort={(key) => toggleSort(key as EmployeeSortKey)}
                      >
                        Designation
                      </SortableTableHead>
                      <TableHead>Assigned Site</TableHead>
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
                    {group.rows.map((emp) => (
                      <TableRow key={emp.id}>
                        <TablePrimaryCell>{emp.name}</TablePrimaryCell>
                        <TableCell className="!text-sbc-gray">
                          {emp.designation}
                        </TableCell>
                        <TableCell className="!text-sbc-gray">
                          {emp.assignedSite || "—"}
                        </TableCell>
                        <TableCell numeric className="!font-semibold !text-sbc-black">
                          {formatRateAmount(emp.rate, "hourly")}
                        </TableCell>
                        <TableCell align="right">
                          <span
                            className={`text-xs font-semibold uppercase tracking-widest ${
                              emp.status === "active"
                                ? "text-sbc-gold"
                                : "text-sbc-gray"
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
                  <span>
                    {group.rows.length} {group.label.toLowerCase()}
                  </span>
                  <span className="text-sbc-gold">Grouped by category</span>
                </TableMeta>
              </TableShell>
            </div>
          ))
        )}
      </div>
    </>
  );
}
