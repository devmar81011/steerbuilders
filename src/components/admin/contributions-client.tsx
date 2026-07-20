"use client";

import { useMemo, useState, useTransition } from "react";
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
import {
  TableDeleteButton,
  TableEditButton,
  TableRowActions,
} from "@/components/admin/table-row-actions";
import {
  createPayrollAdjustment,
  deletePayrollAdjustment,
  updatePayrollAdjustment,
} from "@/lib/actions/adjustments";
import {
  getRoleOverride,
  mergeRoleRatesForCategory,
  roleRateKey,
  type DeductionRoleRate,
} from "@/lib/deduction-role-rates";
import { slugifyDeductionCode } from "@/lib/deduction-lines";
import {
  employeeCategories,
  formatEmployeeCategory,
  getRolesForCategory,
  type EmployeeCategory,
} from "@/lib/employee-categories";
import {
  formatAdjustmentValue,
  formatCalcTypeLabel,
  formatDefaultAdjustmentValue,
  type AdjustmentCalcType,
  type PayrollAdjustment,
} from "@/lib/payroll-adjustments";

type Props = {
  initialAdjustments: PayrollAdjustment[];
};

type FormState = {
  label: string;
  code: string;
  calcType: AdjustmentCalcType;
  value: string;
  description: string;
  active: boolean;
  roleRates: Record<string, string>;
};

type DeductionTab = EmployeeCategory;

const tabs: {
  id: DeductionTab;
  label: string;
  description: string;
}[] = [
  {
    id: "construction",
    label: "Construction",
    description: "Foreman, Skilled, Labor — weekly pay run.",
  },
  {
    id: "admin",
    label: "Admin",
    description: "Operations, Finance/Admin — semi-monthly pay run.",
  },
  {
    id: "ojt",
    label: "OJT",
    description: "Trainee — semi-monthly pay run.",
  },
];

const defaultForm = (): FormState => ({
  label: "",
  code: "",
  calcType: "fixed_per_period",
  value: "",
  description: "",
  active: true,
  roleRates: {},
});

function roleRatesToFormMap(
  roleRates: DeductionRoleRate[] | undefined,
  category: EmployeeCategory
) {
  const map: Record<string, string> = {};
  for (const rate of roleRates ?? []) {
    if (rate.category !== category) continue;
    map[roleRateKey(rate.category, rate.designation)] = String(rate.value);
  }
  return map;
}

function countRoleOverridesForCategory(
  rule: PayrollAdjustment,
  category: EmployeeCategory
) {
  return (
    rule.roleRates?.filter((rate) => rate.category === category).length ?? 0
  );
}

export function ContributionsClient({ initialAdjustments }: Props) {
  const [adjustments, setAdjustments] = useState(initialAdjustments);
  const [activeTab, setActiveTab] = useState<DeductionTab>("construction");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const activeTabMeta = tabs.find((tab) => tab.id === activeTab)!;
  const activeRoles = getRolesForCategory(activeTab);

  const visibleRows = useMemo(
    () => [...adjustments].sort((a, b) => a.sortOrder - b.sortOrder),
    [adjustments]
  );

  function resetForm() {
    setEditingId(null);
    setForm(defaultForm());
  }

  function startEdit(rule: PayrollAdjustment) {
    setEditingId(rule.id);
    setForm({
      label: rule.label,
      code: rule.code,
      calcType: rule.calcType,
      value: String(rule.value),
      description: rule.description,
      active: rule.active,
      roleRates: roleRatesToFormMap(rule.roleRates, activeTab),
    });
    setMessage(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const editingRule = editingId
      ? adjustments.find((item) => item.id === editingId)
      : undefined;

    const role_rates = editingId
      ? mergeRoleRatesForCategory(
          activeTab,
          form.roleRates,
          editingRule?.roleRates,
          activeRoles
        )
      : mergeRoleRatesForCategory(activeTab, form.roleRates, [], activeRoles);

    const payload = {
      label: form.label.trim(),
      code: slugifyDeductionCode(form.code || form.label),
      calc_type: form.calcType,
      value: Number(form.value) || 0,
      description: form.description.trim(),
      active: form.active,
      role_rates,
    };

    if (!payload.label) {
      setMessage("Label is required.");
      return;
    }

    startTransition(async () => {
      const result = editingId
        ? await updatePayrollAdjustment(editingId, payload)
        : await createPayrollAdjustment(payload);

      if (result.error) {
        setMessage(result.error);
        return;
      }

      const savedId =
        editingId ??
        ("id" in result && result.id ? String(result.id) : `adj-${Date.now()}`);

      const nextRoleRates: DeductionRoleRate[] = payload.role_rates.map(
        (rate, index) => ({
          id: `drr-${Date.now()}-${index}`,
          adjustmentId: savedId,
          category: rate.category,
          designation: rate.designation as DeductionRoleRate["designation"],
          value: rate.value,
        })
      );

      if (editingId) {
        setAdjustments((prev) =>
          prev.map((item) =>
            item.id === editingId
              ? {
                  ...item,
                  label: payload.label,
                  code: payload.code,
                  calcType: payload.calc_type,
                  value: payload.value,
                  description: payload.description,
                  active: payload.active,
                  roleRates: nextRoleRates,
                }
              : item
          )
        );
        setMessage(`${payload.label} updated for ${activeTabMeta.label}.`);
      } else {
        setAdjustments((prev) => [
          ...prev,
          {
            id: savedId,
            label: payload.label,
            code: payload.code,
            calcType: payload.calc_type,
            value: payload.value,
            description: payload.description,
            active: payload.active,
            sortOrder: prev.length + 1,
            roleRates: nextRoleRates,
          },
        ]);
        setMessage(`${payload.label} added.`);
      }

      resetForm();
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const result = await deletePayrollAdjustment(id);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setAdjustments((prev) => prev.filter((item) => item.id !== id));
      setMessage("Deduction removed.");
      if (editingId === id) resetForm();
    });
  }

  const valueLabel =
    form.calcType === "percent_of_gross"
      ? "Default rate (%)"
      : "Default amount per pay run (PHP)";

  return (
    <>
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest text-sbc-gray">
          Admin
        </p>
        <h1 className="mt-2 text-2xl font-bold text-sbc-gold">
          Statutory Deductions
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-sbc-gray">
          Configure SSS, PhilHealth, Pag-IBIG, and custom modules. Use the tabs
          below to set role-specific amounts for each payroll group.
        </p>
      </div>

      <div className="mb-6 flex gap-1 border-b border-sbc-gray-light">
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                resetForm();
              }}
              className={`cursor-pointer border-b-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] transition-colors ${
                active
                  ? "border-sbc-gold text-sbc-gold-dark"
                  : "border-transparent text-sbc-gray hover:border-sbc-gold/40 hover:text-sbc-gold-dark"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <p className="mb-4 text-sm text-sbc-gray">{activeTabMeta.description}</p>

      <p className="mb-6 rounded-lg border border-sbc-gold/25 bg-sbc-gold/5 px-4 py-3 text-sm text-sbc-gray">
        Set a <span className="font-medium">default</span> for all roles, then
        optional overrides per role on this tab. Blank role fields use the
        default. PhilHealth (% of gross) usually stays one default for everyone.
      </p>

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
          {editingId
            ? `Edit module · ${activeTabMeta.label}`
            : "Add deduction module"}
        </p>

        <Input
          label="Label"
          size="sm"
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
          placeholder="SSS"
          required
        />

        <Input
          label="Code"
          size="sm"
          value={form.code}
          onChange={(e) => setForm({ ...form, code: e.target.value })}
          placeholder="Auto from label if blank"
        />

        <Select
          label="Calculation"
          size="sm"
          value={form.calcType}
          onChange={(e) =>
            setForm({
              ...form,
              calcType: e.target.value as AdjustmentCalcType,
            })
          }
        >
          <option value="fixed_per_period">Fixed per pay run</option>
          <option value="percent_of_gross">% of gross pay</option>
        </Select>

        <Input
          label={valueLabel}
          size="sm"
          type="number"
          min="0"
          step={form.calcType === "percent_of_gross" ? "0.01" : "1"}
          value={form.value}
          onChange={(e) => setForm({ ...form, value: e.target.value })}
          required
        />

        <Input
          label="Description"
          size="sm"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="md:col-span-2"
        />

        <label className="flex items-center gap-2 text-sm text-sbc-black">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
            className="accent-sbc-gold"
          />
          Active for payroll calculations
        </label>

        {editingId && (
          <div className="md:col-span-2 rounded-lg border border-sbc-gray-light p-4">
            <p className="text-xs font-medium uppercase tracking-widest text-sbc-gold">
              {activeTabMeta.label} role overrides
            </p>
            <p className="mt-1 text-xs text-sbc-gray">
              {employeeCategories[activeTab].designations.join(", ")} — leave blank to
              use the default.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {activeRoles.map((role) => {
                const key = roleRateKey(activeTab, role);
                return (
                  <Input
                    key={key}
                    label={role}
                    size="sm"
                    type="number"
                    min="0"
                    step={form.calcType === "percent_of_gross" ? "0.01" : "1"}
                    value={form.roleRates[key] ?? ""}
                    placeholder={form.value || "Default"}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        roleRates: {
                          ...form.roleRates,
                          [key]: e.target.value,
                        },
                      })
                    }
                  />
                );
              })}
            </div>
          </div>
        )}

        <div className="md:col-span-2 flex flex-wrap gap-3">
          <Button type="submit" size="sm" disabled={pending}>
            {editingId ? "Update Module" : "Add Module"}
          </Button>
          {editingId && (
            <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
              Cancel
            </Button>
          )}
        </div>
      </form>

      <TableShell
        minWidth={`${760 + activeRoles.length * 120}px`}
        scrollable
      >
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Module</TableHead>
              <TableHead>Calculation</TableHead>
              <TableHead align="right">Default</TableHead>
              {activeRoles.map((role) => (
                <TableHead key={role} align="right">
                  {role}
                </TableHead>
              ))}
              <TableHead align="center">Active</TableHead>
              <TableHead align="right">Actions</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {visibleRows.map((rule) => (
              <TableRow key={rule.id}>
                <TablePrimaryCell subtitle={rule.description || undefined}>
                  {rule.label}
                </TablePrimaryCell>
                <TableCell className="align-top text-sm text-sbc-gray">
                  {formatCalcTypeLabel(rule.calcType)}
                </TableCell>
                <TableCell align="right" numeric className="align-top !font-semibold">
                  {formatDefaultAdjustmentValue(rule)}
                </TableCell>
                {activeRoles.map((role) => {
                  const override = getRoleOverride(
                    rule.roleRates,
                    activeTab,
                    role
                  );
                  const effective = override?.value ?? rule.value;

                  return (
                    <TableCell
                      key={role}
                      align="right"
                      numeric
                      className={`align-top ${
                        override
                          ? "!font-semibold !text-sbc-black"
                          : "!text-sbc-gray"
                      }`}
                    >
                      {formatAdjustmentValue(rule, effective)}
                    </TableCell>
                  );
                })}
                <TableCell align="center" className="align-top">
                  <span
                    className={`text-xs font-semibold uppercase tracking-widest ${
                      rule.active ? "text-emerald-700" : "text-sbc-gray"
                    }`}
                  >
                    {rule.active ? "Yes" : "No"}
                  </span>
                  <span className="mt-1 block text-[10px] text-sbc-gray">
                    {countRoleOverridesForCategory(rule, activeTab)} override
                    {countRoleOverridesForCategory(rule, activeTab) === 1
                      ? ""
                      : "s"}
                  </span>
                </TableCell>
                <TableCell align="right" className="align-top">
                  <TableRowActions>
                    <TableEditButton onClick={() => startEdit(rule)} />
                    <TableDeleteButton onClick={() => handleDelete(rule.id)} />
                  </TableRowActions>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TableMeta>
          <span>
            {visibleRows.length} modules · {formatEmployeeCategory(activeTab)}
          </span>
        </TableMeta>
      </TableShell>
    </>
  );
}
