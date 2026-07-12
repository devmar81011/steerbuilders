"use client";

import { useMemo, useState, useTransition } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  createProject,
  deleteProject,
  updateProject,
} from "@/lib/actions/projects";
import { ProjectImagesEditor } from "@/components/admin/project-images-editor";
import { ProjectImagesPicker } from "@/components/admin/project-images-picker";
import { normalizeProjectImages } from "@/lib/project-images";
import { getProjectCategory, getStatusBadgeVariant, isCompletedProject } from "@/lib/project-status";
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
    status: "Completed",
    completion: "",
    description: "",
    featured: false,
    images: [] as string[],
  });

  const completedCount = useMemo(
    () => items.filter((p) => isCompletedProject(p)).length,
    [items]
  );

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const { images, ...projectFields } = form;
      const result = await createProject({
        ...projectFields,
        images: normalizeProjectImages(images),
        category: getProjectCategory(form.status),
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
        images: [],
      });
      window.location.reload();
    });
  }

  function handleDelete(id: string) {
    if (id.startsWith("static-")) {
      setMessage("Connect Supabase to enable editing and delete.");
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
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-widest text-sbc-gray">
          Admin
        </p>
        <h1 className="mt-2 text-2xl font-bold text-sbc-gold">Projects</h1>
        <p className="mt-2 text-sm font-semibold text-sbc-gray">
          {usingDatabase
            ? `${items.length} projects in database (${completedCount} completed)`
            : `${items.length} projects shown — connect Supabase to save changes`}
        </p>
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
          size="sm"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <Input
          label="Scope of Work"
          size="sm"
          value={form.scope}
          onChange={(e) => setForm({ ...form, scope: e.target.value })}
          required
        />
        <Input
          label="Location"
          size="sm"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          required
        />
        <Input
          label="Completion Date"
          size="sm"
          value={form.completion}
          onChange={(e) => setForm({ ...form, completion: e.target.value })}
          required
        />
        <Input
          label="Status"
          size="sm"
          list="project-status-suggestions"
          placeholder="e.g. Completed, Ongoing, On hold"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          required
        />
        <datalist id="project-status-suggestions">
          <option value="Completed" />
          <option value="Ongoing" />
          <option value="On hold" />
        </datalist>
        <Input
          label="Description (optional)"
          size="sm"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <div className="md:col-span-2">
          <p className="mb-3 text-[10px] font-medium uppercase tracking-widest text-sbc-gray">
            Project photos (up to 4)
          </p>
          <ProjectImagesPicker
            images={form.images}
            onChange={(images) => setForm({ ...form, images })}
          />
        </div>
        <div className="md:col-span-2">
          <Button type="submit" disabled={pending}>
            Save Project
          </Button>
        </div>
      </form>

      <TableShell minWidth="960px" scrollable>
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Project</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Photos</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead align="right">Actions</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {items.map((project) => (
              <TableRow key={project.id}>
                <TablePrimaryCell subtitle={project.location}>
                  {project.name}
                </TablePrimaryCell>
                <TableCell className="max-w-xs !text-sbc-gray">{project.scope}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(project.status, project.category)}>
                    {project.status}
                  </Badge>
                </TableCell>
                <TableCell className="relative">
                  <ProjectImagesEditor
                    projectId={project.id}
                    initialImages={project.images ?? []}
                    disabled={project.id.startsWith("static-")}
                    onSaved={(images) =>
                      setItems((prev) =>
                        prev.map((p) => (p.id === project.id ? { ...p, images } : p))
                      )
                    }
                  />
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    onClick={() => toggleFeatured(project.id, project.featured)}
                    className="text-xs font-semibold uppercase tracking-widest text-sbc-gold transition-colors hover:text-sbc-gold-dark"
                  >
                    {project.featured ? "Yes" : "No"}
                  </button>
                </TableCell>
                <TableCell align="right">
                  <button
                    type="button"
                    onClick={() => handleDelete(project.id)}
                    className="text-xs font-semibold uppercase tracking-widest text-sbc-gray transition-colors hover:text-sbc-gold-dark"
                  >
                    Delete
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TableMeta>
          <span>{items.length} projects</span>
          <span className="text-sbc-gold">
            {usingDatabase ? "Live database" : "Preview mode"}
          </span>
        </TableMeta>
      </TableShell>
    </AdminShell>
  );
}
