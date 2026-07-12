"use client";

import { useMemo, useState, useTransition } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { Card } from "@/components/ui/card";
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
import { createEmployee } from "@/lib/actions/payroll";
import {
  employeeCategories,
  formatEmployeeCategory,
  getRolesForCategory,
  type EmployeeCategory,
} from "@/lib/employee-categories";
import {
  findDailyRate,
  type DailyRate,
} from "@/lib/daily-rates";
import { formatCurrency, type Employee } from "@/lib/mvp-data";

type Props = {
  employees: Employee[];
  dailyRates: DailyRate[];
};

export function EmployeesClient({ employees: initialEmployees, dailyRates }: Props) {
  const [employees, setEmployees] = useState(initialEmployees);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const defaultRole = getRolesForCategory("construction")[0];
  const [form, setForm] = useState<{
    name: string;
    category: EmployeeCategory;
    role: string;
  }>({
    name: "",
    category: "construction",
    role: defaultRole,
  });

  const roleOptions = useMemo(
    () => getRolesForCategory(form.category),
    [form.category]
  );

  const selectedRate = findDailyRate(dailyRates, form.category, form.role);

  function handleCategoryChange(category: EmployeeCategory) {
    const roles = getRolesForCategory(category);
    setForm({ ...form, category, role: roles[0] });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedRate) {
      setMessage("Add this category and role in Daily Rates first.");
      return;
    }

    startTransition(async () => {
      const result = await createEmployee({
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

      const newEmployee: Employee = {
        id: `emp-${Date.now()}`,
        name: form.name,
        category: form.category,
        role: form.role as Employee["role"],
        rate: selectedRate.rate,
        rateType: selectedRate.rateType,
        status: "active",
      };

      setEmployees((prev) => [...prev, newEmployee]);
      setMessage("Employee added.");
      setForm({
        name: "",
        category: "construction",
        role: getRolesForCategory("construction")[0],
      });
    });
  }

  return (
    <AdminShell>
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
        <p className="mb-6 border border-sbc-gold/30 bg-sbc-gold/10 px-4 py-3 text-sm font-semibold text-sbc-black">
          {message}
        </p>
      )}

      <Card className="mb-8">
        <p className="mb-4 text-xs font-medium uppercase tracking-widest text-sbc-gold">
          Add Employee
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
            <p className="border border-sbc-gray-light bg-sbc-off-white px-3 py-2 text-sm font-medium text-sbc-black">
              {selectedRate
                ? selectedRate.rateType === "hourly"
                  ? `${formatCurrency(selectedRate.rate)}/day`
                  : `${formatCurrency(selectedRate.rate)}/mo`
                : "—"}
            </p>
          </div>

          <div className="md:col-span-2">
            <Button type="submit" size="sm" disabled={pending || !selectedRate}>
              + Add Employee
            </Button>
          </div>
        </form>
      </Card>

      <TableShell minWidth="880px" scrollable>
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead align="right">Status</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {employees.map((emp) => (
              <TableRow key={emp.id}>
                <TablePrimaryCell>{emp.name}</TablePrimaryCell>
                <TableCell>
                  <Badge variant={emp.category === "construction" ? "dark" : "gold"}>
                    {formatEmployeeCategory(emp.category)}
                  </Badge>
                </TableCell>
                <TableCell className="!text-sbc-gray">{emp.role}</TableCell>
                <TableCell numeric className="!font-semibold !text-sbc-black">
                  {emp.rateType === "hourly"
                    ? `${formatCurrency(emp.rate)}/day`
                    : `${formatCurrency(emp.rate)}/mo`}
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TableMeta>
          <span>{employees.length} employees</span>
          <span className="text-sbc-gold">Construction &amp; Admin roster</span>
        </TableMeta>
      </TableShell>
    </AdminShell>
  );
}
