# DATABASE MIGRATIONS

## Production Deployment - July 20, 2026

**Status:** Completed on production Supabase (`stoocngdvtgvbbvdjmdo`)

Applied in order:

1. `025_attendance_hours.sql` — construction attendance day columns are JSONB `{ hours, overtimeHours }`
2. `026_employee_assigned_site.sql` — employees have `assigned_site`; `role` renamed to `designation`
3. `027_sites_table.sql` — `sites` table with RLS for admin site management

---

## New Features Available After Migration

- Construction attendance with hours + OT input
- Disbursement dropdown (MLhuilier/BPI)
- Sites management page at `/admin/sites`
- Employee assigned site field
- Designation (formerly role) terminology
- Statutory deductions tab removed from navigation

---

*Updated: Monday, July 20, 2026*
