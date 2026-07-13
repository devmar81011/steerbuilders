"use client";

import { useMemo, useState, useTransition } from "react";
import { SortableTableHead } from "@/components/ui/sortable-table-head";
import { sortRows, useTableSort } from "@/lib/table-sort";
import { AdminShell } from "@/components/layout/admin-shell";
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
  createProject,
  deleteProject,
  updateProject,
} from "@/lib/actions/projects";
import { setFeaturedProjectLimit } from "@/lib/actions/site-settings";
import {
  MAX_FEATURED_PROJECT_LIMIT,
  MIN_FEATURED_PROJECT_LIMIT,
} from "@/lib/featured-projects-config";
import {
  getFeaturedLimitPreview,
  mergeProjectsWithPreview,
  saveFeaturedLimitPreview,
  saveProjectFeaturedPreview,
  selectFeaturedProjects,
} from "@/lib/projects-preview-storage";
import { ProjectImagesEditor } from "@/components/admin/project-images-editor";
import { textActionGoldClass } from "@/components/ui/icon-button";
import {
  TableEditButton,
  TableDeleteButton,
  TableRowActions,
} from "@/components/admin/table-row-actions";
import { ProjectImagesPicker } from "@/components/admin/project-images-picker";
import { normalizeProjectImages } from "@/lib/project-images";
import {
  getProjectCategory,
  getStatusLabelClass,
  isCompletedProject,
  parseProjectStatusForForm,
  resolveProjectStatus,
  type ProjectStatusPreset,
} from "@/lib/project-status";
import type { ProjectRow } from "@/lib/supabase/types";

type Props = {
  projects: ProjectRow[];
  usingDatabase: boolean;
  featuredLimit: number;
};

type ProjectSortKey = "name" | "scope" | "status" | "photos" | "featured";

export function AdminProjectsClient({
  projects,
  usingDatabase,
  featuredLimit: initialFeaturedLimit,
}: Props) {
  const serverMerged = useMemo(
    () => (usingDatabase ? projects : mergeProjectsWithPreview(projects)),
    [projects, usingDatabase]
  );
  const [items, setItems] = useState(serverMerged);
  const [syncedServerMerged, setSyncedServerMerged] = useState(serverMerged);
  const [featuredLimit, setFeaturedLimit] = useState(() =>
    usingDatabase || typeof window === "undefined"
      ? initialFeaturedLimit
      : getFeaturedLimitPreview()
  );
  const [featuredLimitInput, setFeaturedLimitInput] = useState(() =>
    String(
      usingDatabase || typeof window === "undefined"
        ? initialFeaturedLimit
        : getFeaturedLimitPreview()
    )
  );
  const { sort, toggleSort } = useTableSort<ProjectSortKey>({ defaultKey: "name" });
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    scope: "",
    location: "",
    statusPreset: "Completed" as ProjectStatusPreset,
    statusOther: "",
    description: "",
    featured: false,
    images: [] as string[],
  });

  if (serverMerged !== syncedServerMerged) {
    setSyncedServerMerged(serverMerged);
    setItems(serverMerged);
    if (usingDatabase) {
      setFeaturedLimit(initialFeaturedLimit);
      setFeaturedLimitInput(String(initialFeaturedLimit));
    } else {
      const previewLimit = getFeaturedLimitPreview();
      setFeaturedLimit(previewLimit);
      setFeaturedLimitInput(String(previewLimit));
    }
  }

  const completedCount = useMemo(
    () => items.filter((p) => isCompletedProject(p)).length,
    [items]
  );

  const featuredCount = useMemo(
    () => items.filter((project) => project.featured).length,
    [items]
  );

  const homepageFeaturedIds = useMemo(
    () => new Set(selectFeaturedProjects(items, featuredLimit).map((project) => project.id)),
    [items, featuredLimit]
  );

  const homepageFeaturedCount = homepageFeaturedIds.size;
  const overFeaturedLimit = featuredCount > featuredLimit;

  function countFeaturedCandidates(excludeId?: string) {
    return items.filter((project) => project.featured && project.id !== excludeId)
      .length;
  }

  function featuredLimitMessage(limit = featuredLimit) {
    return `Featured limit reached (${limit}). Unfeature another project first or increase the limit below.`;
  }

  const sortedItems = useMemo(
    () =>
      sortRows(items, sort, (row, key) => {
        if (key === "photos") return row.images?.length ?? 0;
        if (key === "featured") return row.featured;
        return row[key];
      }),
    [items, sort]
  );

  function resetForm() {
    setEditingId(null);
    setForm({
      name: "",
      scope: "",
      location: "",
      statusPreset: "Completed",
      statusOther: "",
      description: "",
      featured: false,
      images: [] as string[],
    });
  }

  function startEdit(project: ProjectRow) {
    setEditingId(project.id);
    setForm({
      name: project.name,
      scope: project.scope,
      location: project.location,
      ...parseProjectStatusForForm(project.status),
      description: project.description ?? "",
      featured: project.featured,
      images: project.images ?? [],
    });
    setMessage(null);
  }

  function buildProjectRow(
    id: string,
    payload: {
      name: string;
      scope: string;
      location: string;
      status: string;
      description: string;
      featured: boolean;
      images: string[];
      category: "completed" | "ongoing";
    },
    existing?: ProjectRow
  ): ProjectRow {
    return {
      id,
      name: payload.name,
      scope: payload.scope,
      location: payload.location,
      status: payload.status,
      completion: existing?.completion ?? "",
      description: payload.description || null,
      featured: payload.featured,
      category: payload.category,
      images: payload.images,
      sort_order: existing?.sort_order ?? items.length,
      created_at: existing?.created_at ?? new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const status = resolveProjectStatus(form.statusPreset, form.statusOther);
      if (form.statusPreset === "other" && !status) {
        setMessage("Please specify the project status.");
        return;
      }

      const { images, statusPreset: _preset, statusOther: _other, ...projectFields } = form;
      const payload = {
        ...projectFields,
        status,
        completion: "",
        images: normalizeProjectImages(images),
        category: getProjectCategory(status),
      };

      if (payload.featured && countFeaturedCandidates(editingId ?? undefined) >= featuredLimit) {
        setMessage(featuredLimitMessage());
        return;
      }

      if (!usingDatabase) {
        if (editingId) {
          setItems((prev) =>
            prev.map((p) =>
              p.id === editingId
                ? buildProjectRow(editingId, payload, p)
                : p
            )
          );
          saveProjectFeaturedPreview(editingId, payload.featured);
          setMessage("Project updated.");
        } else {
          const id = `static-${Date.now()}`;
          setItems((prev) => [...prev, buildProjectRow(id, payload)]);
          saveProjectFeaturedPreview(id, payload.featured);
          setMessage("Project added.");
        }
        resetForm();
        return;
      }

      const result = editingId
        ? await updateProject(editingId, payload)
        : await createProject(payload);

      if (result.error) {
        setMessage(result.error);
        return;
      }

      setMessage(editingId ? "Project updated." : "Project added.");
      resetForm();
      window.location.reload();
    });
  }

  function handleDelete(id: string) {
    if (!usingDatabase) {
      setItems((prev) => prev.filter((p) => p.id !== id));
      setMessage("Project removed.");
      return;
    }

    startTransition(async () => {
      const result = await deleteProject(id);
      setMessage(result.error ?? "Project deleted.");
      if (result.success) setItems((prev) => prev.filter((p) => p.id !== id));
    });
  }

  function toggleFeatured(id: string, featured: boolean) {
    const next = !featured;

    if (next && countFeaturedCandidates(id) >= featuredLimit) {
      setMessage(featuredLimitMessage());
      return;
    }

    setMessage(null);
    setItems((prev) =>
      prev.map((p) => (p.id === id ? { ...p, featured: next } : p))
    );

    if (!usingDatabase) {
      saveProjectFeaturedPreview(id, next);
      setMessage(next ? "Project marked as featured." : "Project removed from featured.");
      return;
    }

    startTransition(async () => {
      const result = await updateProject(id, { featured: next });
      if (result.error) {
        setItems((prev) =>
          prev.map((p) => (p.id === id ? { ...p, featured } : p))
        );
        setMessage(result.error);
        return;
      }

      setMessage(next ? "Project marked as featured." : "Project removed from featured.");
    });
  }

  function handleFeaturedLimitSave(e: React.FormEvent) {
    e.preventDefault();
    const parsed = Number.parseInt(featuredLimitInput, 10);
    if (!Number.isFinite(parsed)) {
      setMessage("Enter a valid featured project limit.");
      return;
    }

    const nextLimit = Math.min(
      MAX_FEATURED_PROJECT_LIMIT,
      Math.max(MIN_FEATURED_PROJECT_LIMIT, parsed)
    );

    if (featuredCount > nextLimit) {
      setMessage(
        `You currently have ${featuredCount} featured projects. Unfeature ${featuredCount - nextLimit} before lowering the limit to ${nextLimit}.`
      );
      return;
    }

    startTransition(async () => {
      if (!usingDatabase) {
        saveFeaturedLimitPreview(nextLimit);
        setFeaturedLimit(nextLimit);
        setFeaturedLimitInput(String(nextLimit));
        setMessage(`Featured limit set to ${nextLimit}.`);
        return;
      }

      const result = await setFeaturedProjectLimit(nextLimit);
      if (result.error) {
        setMessage(result.error);
        return;
      }

      setFeaturedLimit(result.limit ?? nextLimit);
      setFeaturedLimitInput(String(result.limit ?? nextLimit));
      setMessage(`Featured limit set to ${result.limit ?? nextLimit}.`);
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
            ? `${items.length} projects (${completedCount} completed)`
            : `${items.length} projects`}
        </p>
      </div>

      {overFeaturedLimit && (
        <p
          className="mb-6 border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900"
          role="status"
        >
          {featuredCount} projects are marked featured, but only {featuredLimit} can appear
          on the homepage. Unfeature {featuredCount - featuredLimit} project
          {featuredCount - featuredLimit === 1 ? "" : "s"} to match the limit.
        </p>
      )}

      {message && (
        <p className="mb-6 border border-sbc-gold/30 bg-sbc-gold/10 px-4 py-3 text-sm font-semibold text-sbc-black">
          {message}
        </p>
      )}

      <form
        onSubmit={handleFeaturedLimitSave}
        className="mb-6 border border-sbc-gray-light bg-sbc-white p-4"
      >
        <p className="text-[10px] font-medium uppercase tracking-widest text-sbc-gray">
          Homepage featured limit
        </p>
        <p className="mt-1 text-xs text-sbc-gray">
          {homepageFeaturedCount} of {featuredLimit} shown on the homepage
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-xs font-medium uppercase tracking-widest text-sbc-gray">
            Max on homepage
          </span>
          <Input
            aria-label="Max featured projects on homepage"
            size="sm"
            type="number"
            min={MIN_FEATURED_PROJECT_LIMIT}
            max={MAX_FEATURED_PROJECT_LIMIT}
            value={featuredLimitInput}
            onChange={(e) => setFeaturedLimitInput(e.target.value)}
            className="w-20 text-center"
          />
          <Button
            type="submit"
            size="sm"
            disabled={pending}
            className="h-10 min-h-10 shrink-0 px-5"
          >
            Save limit
          </Button>
        </div>
      </form>

      <form
        onSubmit={handleSubmit}
        className="mb-8 grid gap-4 border border-sbc-gray-light bg-sbc-white p-6 md:grid-cols-2"
      >
        <p className="md:col-span-2 text-xs font-medium uppercase tracking-widest text-sbc-gold">
          {editingId ? "Edit Project" : "Add Project"}
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
        <Select
          label="Status"
          size="sm"
          value={form.statusPreset}
          onChange={(e) =>
            setForm({
              ...form,
              statusPreset: e.target.value as ProjectStatusPreset,
              statusOther: e.target.value === "other" ? form.statusOther : "",
            })
          }
        >
          <option value="Completed">Completed</option>
          <option value="Ongoing">Ongoing</option>
          <option value="other">Others — please specify</option>
        </Select>
        {form.statusPreset === "other" && (
          <Input
            label="Please specify"
            size="sm"
            placeholder="e.g. On hold, Delayed"
            value={form.statusOther}
            onChange={(e) => setForm({ ...form, statusOther: e.target.value })}
            required
          />
        )}
        <Input
          label="Description (optional)"
          size="sm"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <div className="md:col-span-2">
          <p className="mb-3 text-[10px] font-medium uppercase tracking-widest text-sbc-gray">
            Project photos
          </p>
          <ProjectImagesPicker
            images={form.images}
            onChange={(images) => setForm({ ...form, images })}
          />
        </div>
        <div className="md:col-span-2 flex flex-wrap gap-3">
          <Button type="submit" disabled={pending}>
            {editingId ? "Update Project" : "Save Project"}
          </Button>
          {editingId && (
            <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
              Cancel
            </Button>
          )}
        </div>
      </form>

      <TableShell minWidth="960px" scrollable>
        <Table>
          <TableHeader>
            <tr>
              <SortableTableHead
                sortKey="name"
                activeKey={sort.key}
                direction={sort.direction}
                onSort={(key) => toggleSort(key as ProjectSortKey)}
              >
                Project
              </SortableTableHead>
              <SortableTableHead
                sortKey="scope"
                activeKey={sort.key}
                direction={sort.direction}
                onSort={(key) => toggleSort(key as ProjectSortKey)}
              >
                Scope
              </SortableTableHead>
              <SortableTableHead
                sortKey="status"
                activeKey={sort.key}
                direction={sort.direction}
                onSort={(key) => toggleSort(key as ProjectSortKey)}
              >
                Status
              </SortableTableHead>
              <SortableTableHead
                sortKey="photos"
                activeKey={sort.key}
                direction={sort.direction}
                onSort={(key) => toggleSort(key as ProjectSortKey)}
              >
                Photos
              </SortableTableHead>
              <SortableTableHead
                sortKey="featured"
                activeKey={sort.key}
                direction={sort.direction}
                onSort={(key) => toggleSort(key as ProjectSortKey)}
              >
                Featured
              </SortableTableHead>
              <TableHead align="right">Actions</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {sortedItems.map((project) => (
              <TableRow key={project.id}>
                <TablePrimaryCell subtitle={project.location}>
                  {project.name}
                </TablePrimaryCell>
                <TableCell className="max-w-xs !text-sbc-gray">{project.scope}</TableCell>
                <TableCell>
                  <span
                    className={`text-xs uppercase tracking-widest ${getStatusLabelClass(project.status, project.category)}`}
                  >
                    {project.status}
                  </span>
                </TableCell>
                <TableCell className="relative">
                  <ProjectImagesEditor
                    projectId={project.id}
                    initialImages={project.images ?? []}
                    persistToServer={usingDatabase}
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
                    className={textActionGoldClass}
                    title={
                      project.featured && !homepageFeaturedIds.has(project.id)
                        ? "Featured, but not shown on homepage (limit reached)"
                        : "Toggle featured"
                    }
                  >
                    {project.featured
                      ? homepageFeaturedIds.has(project.id)
                        ? "Yes"
                        : "Yes · hidden"
                      : "No"}
                  </button>
                </TableCell>
                <TableCell align="right">
                  <TableRowActions>
                    <TableEditButton onClick={() => startEdit(project)} />
                    <TableDeleteButton onClick={() => handleDelete(project.id)} />
                  </TableRowActions>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TableMeta>
          <span>{items.length} projects</span>
          <span className="text-sbc-gold">
            {homepageFeaturedCount}/{featuredLimit} on homepage
            {featuredCount > homepageFeaturedCount
              ? ` · ${featuredCount} marked featured`
              : ""}
          </span>
        </TableMeta>
      </TableShell>
    </AdminShell>
  );
}
