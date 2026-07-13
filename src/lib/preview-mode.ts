export function isPreviewEmployeeId(id: string): boolean {
  return id.startsWith("emp-") || id.startsWith("preview-");
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Mock and generated payroll rows use non-UUID ids (preview-*, pay-*). */
export function isPreviewPayrollEntryId(id: string): boolean {
  return !UUID_RE.test(id);
}

const PREVIEW_PAYROLL_ID_RE =
  /^preview-(.+)-(w-\d{4}-\d{2}-\d{2}|s-\d{4}-\d{2}-\d{1,2})$/;

export function parsePreviewPayrollEntryId(
  id: string
): { employeeId: string; periodKey: string } | null {
  const match = id.match(PREVIEW_PAYROLL_ID_RE);
  if (!match) return null;
  return { employeeId: match[1], periodKey: match[2] };
}
