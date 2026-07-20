# 🚨 IMPORTANT: DATABASE MIGRATIONS REQUIRED

## Production Deployment - July 20, 2026

The code changes have been deployed to production (main branch), but **DATABASE MIGRATIONS ARE REQUIRED** for the new features to work properly.

---

## ⚠️ ACTION REQUIRED

Run these 3 migration files **IN ORDER** in your production Supabase database:

### 1. Migration 025: Attendance Hours Structure
**File:** `supabase/migrations/025_attendance_hours.sql`

**What it does:**
- Converts construction attendance from boolean (present/absent) to JSONB with hours tracking
- Each day now stores: `{ hours: number, overtimeHours: number }`

### 2. Migration 026: Employee Assigned Site & Designation
**File:** `supabase/migrations/026_employee_assigned_site.sql`

**What it does:**
- Adds `assigned_site` field to employees table
- Renames `role` column to `designation`

### 3. Migration 027: Sites Management Table
**File:** `supabase/migrations/027_sites_table.sql`

**What it does:**
- Creates new `sites` table for managing project sites
- Enables dynamic add/edit/delete of sites through the admin panel

---

## 📋 How to Apply Migrations

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste each migration file content
4. Run them **in order** (025 → 026 → 027)

### Option 2: Supabase CLI
```bash
# From project root directory
supabase db push
```

---

## 🎯 New Features Available After Migration

Once migrations are complete, these features will be available:

✅ Construction attendance with hours + OT input  
✅ Disbursement dropdown (MLhuilier/BPI)  
✅ Sites management page at `/admin/sites`  
✅ Employee assigned site field  
✅ Designation (formerly role) terminology  
✅ Statutory deductions tab removed from navigation  

---

## 📝 Notes

- All code changes are already deployed to production
- The system will continue to work, but new features won't function until migrations are run
- Existing data will be preserved during migrations
- No downtime required

**Status:** Pending migration execution on production database

---

*Created: Monday, July 20, 2026*  
*Branch: main*  
*Pull Request: #1*
