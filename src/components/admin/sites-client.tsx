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
import { createSite, deleteSite, updateSite, type Site } from "@/lib/actions/sites";
import {
  TableDeleteButton,
  TableEditButton,
  TableRowActions,
} from "@/components/admin/table-row-actions";

type Props = {
  sites: Site[];
};

type SiteSortKey = "name" | "status";

export function SitesClient({ sites: initialSites }: Props) {
  const [sites, setSites] = useState(initialSites);
  const { sort, toggleSort } = useTableSort<SiteSortKey>({ defaultKey: "name" });
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<{
    name: string;
    status: "active" | "inactive";
  }>({
    name: "",
    status: "active",
  });

  const sortedSites = useMemo(
    () =>
      sortRows(sites, sort, (row, key) => {
        return row[key];
      }),
    [sites, sort]
  );

  function resetForm() {
    setEditingId(null);
    setForm({
      name: "",
      status: "active",
    });
  }

  function startEdit(site: Site) {
    setEditingId(site.id);
    setForm({
      name: site.name,
      status: site.status,
    });
    setMessage(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name.trim()) {
      setMessage("Site name is required.");
      return;
    }

    startTransition(async () => {
      const payload = {
        name: form.name.trim(),
        status: form.status,
      };

      const result = editingId
        ? await updateSite(editingId, payload)
        : await createSite({ name: form.name.trim() });

      if (result.error) {
        setMessage(result.error);
        return;
      }

      if (editingId) {
        setSites((prev) =>
          prev.map((site) =>
            site.id === editingId
              ? {
                  ...site,
                  name: form.name.trim(),
                  status: form.status,
                }
              : site
          )
        );
        setMessage("Site updated.");
      } else {
        const newId =
          "id" in result && typeof result.id === "string"
            ? result.id
            : `site-${Date.now()}`;
        setSites((prev) => [
          ...prev,
          {
            id: newId,
            name: form.name.trim(),
            status: "active",
          },
        ]);
        setMessage("Site added.");
      }

      resetForm();
    });
  }

  function handleDelete(id: string, name: string) {
    if (
      !window.confirm(
        `Delete ${name}? Employees assigned to this site will remain but the site reference will be removed.`
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await deleteSite(id);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setSites((prev) => prev.filter((site) => site.id !== id));
      if (editingId === id) resetForm();
      setMessage("Site deleted.");
    });
  }

  return (
    <>
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest text-sbc-gray">
          Admin
        </p>
        <h1 className="mt-2 text-2xl font-bold text-sbc-gold">Sites</h1>
        <p className="mt-2 text-sm font-semibold text-sbc-gray">
          Manage project sites. Employees can be assigned to these sites.
        </p>
      </div>

      {message && (
        <p className="mb-6 rounded-lg border border-sbc-gold/30 bg-sbc-gold/10 px-4 py-3 text-sm font-semibold text-sbc-black">
          {message}
        </p>
      )}

      <Card className="mb-8">
        <p className="mb-4 text-xs font-medium uppercase tracking-widest text-sbc-gold">
          {editingId ? "Edit Site" : "Add Site"}
        </p>
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
          <Input
            label="Site Name"
            size="sm"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />

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
              {editingId ? "Update Site" : "+ Add Site"}
            </Button>
            {editingId && (
              <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card>

      <TableShell minWidth="600px" scrollable>
        <Table>
          <TableHeader>
            <tr>
              <SortableTableHead
                sortKey="name"
                activeKey={sort.key}
                direction={sort.direction}
                onSort={(key) => toggleSort(key as SiteSortKey)}
              >
                Site Name
              </SortableTableHead>
              <SortableTableHead
                sortKey="status"
                align="right"
                activeKey={sort.key}
                direction={sort.direction}
                onSort={(key) => toggleSort(key as SiteSortKey)}
              >
                Status
              </SortableTableHead>
              <TableHead align="right">Actions</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {sortedSites.map((site) => (
              <TableRow key={site.id}>
                <TablePrimaryCell>{site.name}</TablePrimaryCell>
                <TableCell align="right">
                  <span
                    className={`text-xs font-semibold uppercase tracking-widest ${
                      site.status === "active" ? "text-sbc-gold" : "text-sbc-gray"
                    }`}
                  >
                    {site.status}
                  </span>
                </TableCell>
                <TableCell align="right">
                  <TableRowActions>
                    <TableEditButton onClick={() => startEdit(site)} />
                    <TableDeleteButton
                      label="Delete"
                      onClick={() => handleDelete(site.id, site.name)}
                      disabled={pending}
                    />
                  </TableRowActions>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TableMeta>
          <span>{sites.length} sites</span>
          <span className="text-sbc-gold">Project Sites</span>
        </TableMeta>
      </TableShell>
    </>
  );
}
