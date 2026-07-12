export function isPreviewEmployeeId(id: string): boolean {
  return id.startsWith("emp-") || id.startsWith("preview-");
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Mock and generated payroll rows use non-UUID ids (preview-*, pay-*). */
export function isPreviewPayrollEntryId(id: string): boolean {
  return !UUID_RE.test(id);
}
