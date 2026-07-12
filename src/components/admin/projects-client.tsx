"use client";

import { useMemo, useState, useTransition } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  createProject,
  deleteProject,
  seedProjectsFromContent,
  updateProject,
} from "@/lib/actions/projects";
import type { ProjectRow } from "@/lib/supabase/types";

type Props = {
  projects: ProjectRow[];
  usingDatabase: boolean;
};

export function AdminProjectsClient({ projects, usingDatabase }: Props) {
  const [items, setItems] = useState(projects);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: "",
    scope: "",
    location: "",
    status: "Completed" as ProjectRow["status"],
    completion: "",
    description: "",
    featured: false,
  });

  const completedCount = useMemo(
    () => items.filter((p) => p.status === "Completed").length,
    [items]
  );

  function handleSeed() {
    startTransition(async () => {
      const result = await seedProjectsFromContent();
      setMessage(result.error ?? `Seeded ${result.count} projects from PDF content.`);
      if (result.success) window.location.reload();
    });
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createProject({
        ...form,
        category: form.status === "Completed" ? "completed" : "ongoing",
      });
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setMessage("Project added.");
      setForm({
        name: "",
        scope: "",
        location: "",
        status: "Completed",
        completion: "",
        description: "",
        featured: false,
      });
      window.location.reload();
    });
  }

  function handleDelete(id: string) {
    if (id.startsWith("static-")) {
      setMessage("Connect Supabase and seed projects to enable delete.");
      return;
    }
    startTransition(async () => {
      const result = await deleteProject(id);
      setMessage(result.error ?? "Project deleted.");
      if (result.success) setItems((prev) => prev.filter((p) => p.id !== id));
    });
  }

  function toggleFeatured(id: string, featured: boolean) {
    if (id.startsWith("static-")) return;
    startTransition(async () => {
      await updateProject(id, { featured: !featured });
      setItems((prev) =>
        prev.map((p) => (p.id === id ? { ...p, featured: !featured } : p))
      );
    });
  }

  return (
    <AdminShell>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-sbc-gray">
            Admin
          </p>
          <h1 className="mt-2 text-2xl font-bold text-sbc-gold">Projects</h1>
          <p className="mt-2 text-sm font-semibold text-sbc-gray">
            {usingDatabase
              ? `${items.length} projects in Supabase (${completedCount} completed)`
              : "Using static PDF content — seed database to enable editing"}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button size="sm" variant="secondary" onClick={handleSeed} disabled={pending}>
            Seed from PDF Content
          </Button>
          <Button size="sm" variant="outline" onClick={() => window.open("/admin/design", "_blank")}>
            View Admin Design
          </Button>
        </div>
      </div>

      {message && (
        <p className="mb-6 border border-sbc-gold/30 bg-sbc-gold/10 px-4 py-3 text-sm font-semibold text-sbc-black">
          {message}
        </p>
      )}

      <form
        onSubmit={handleCreate}
        className="mb-8 grid gap-4 border border-sbc-gray-light bg-sbc-white p-6 md:grid-cols-2"
      >
        <p className="md:col-span-2 text-xs font-medium uppercase tracking-widest text-sbc-gold">
          Add / Update Project
        </p>
        <Input
          label="Project Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <Input
          label="Scope of Work"
          value={form.scope}
          onChange={(e) => setForm({ ...form, scope: e.target.value })}
          required
        />
        <Input
          label="Location"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          required
        />
        <Input
          label="Completion Date"
          value={form.completion}
          onChange={(e) => setForm({ ...form, completion: e.target.value })}
          required
        />
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium uppercase tracking-widest text-sbc-gray">
            Status
          </label>
          <select
            value={form.status}
            onChange={(e) =>
              setForm({ ...form, status: e.target.value as ProjectRow["status"] })
            }
            className="border border-sbc-gray-light px-4 py-3 text-sm font-medium"
          >
            <option value="Completed">Completed</option>
            <option value="Ongoing">Ongoing</option>
            <option value="Put on hold in 2025">Put on hold in 2025</option>
          </select>
        </div>
        <Input
          label="Description (optional)"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <div className="md:col-span-2">
          <Button type="submit" disabled={pending}>
            Save Project
          </Button>
        </div>
      </form>

      <div className="overflow-x-auto border border-sbc-gray-light bg-sbc-white">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="border-b border-sbc-gray-light bg-sbc-off-white">
            <tr>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-sbc-gray">
                Project
              </th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-sbc-gray">
                Scope
              </th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-sbc-gray">
                Status
              </th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-sbc-gray">
                Featured
              </th>
              <th className="px-4 py-3 text-xs font-medium uppercase tracking-widest text-sbc-gray">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((project) => (
              <tr key={project.id} className="border-b border-sbc-gray-light">
                <td className="px-4 py-3">
                  <p className="font-semibold">{project.name}</p>
                  <p className="text-xs font-medium text-sbc-gray">{project.location}</p>
                </td>
                <td className="px-4 py-3 font-medium text-sbc-gray">{project.scope}</td>
                <td className="px-4 py-3">
                  <Badge
                    variant={
                      project.status === "Completed"
                        ? "gold"
                        : project.status === "Ongoing"
                          ? "dark"
                          : "light"
                    }
                  >
                    {project.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => toggleFeatured(project.id, project.featured)}
                    className="text-xs font-medium uppercase tracking-widest text-sbc-gold hover:underline"
                  >
                    {project.featured ? "Yes" : "No"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => handleDelete(project.id)}
                    className="text-xs font-medium uppercase tracking-widest text-sbc-gray hover:text-sbc-black"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}
