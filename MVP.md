# Steer Builders — MVP

Living document for the Minimum Viable Product. **Always keep in sync with `src/lib/mvp-status.ts`.**

- **Version:** 0.3.0
- **Last updated:** 2026-07-12
- **Live status page:** `/mvp` (auto-reads from code)

## MVP scope

### Phase 1 — Public website ✅
- [x] Branded homepage (company profile content from PDF)
- [x] Proposal design system (`/design-system`) — hidden from nav, direct URL for internal use
- [x] About page with management team
- [x] Full portfolio page (`/projects`)

### Phase 2 — Admin & payroll 🔄
- [x] Admin dashboard shell
- [x] Employee list (mock data)
- [x] Payroll table (mock data)
- [ ] Supabase Auth login
- [ ] Real employee CRUD
- [ ] Payroll calculation engine
- [ ] Payslip PDF export

### Phase 3 — Infrastructure 🔄
- [x] GitHub repo + Vercel auto-deploy
- [ ] Supabase schema applied + env vars on Vercel
- [ ] Figma design sync via MCP

## Update workflow

Every time we ship something:

1. **Code** — implement the feature
2. **`src/lib/mvp-status.ts`** — set feature status to `done` or `in_progress`
3. **`CHANGELOG.md`** — add a dated entry
4. **`MVP.md`** — check off items (this file)
5. **Git push to `main`** — Vercel deploys automatically

## Routes (MVP)

| Route | Purpose |
|-------|---------|
| `/` | Public homepage |
| `/design-system` | Brand & UI reference (hidden — internal use only) |
| `/mvp` | Live roadmap (reads mvp-status.ts) |
| `/admin` | Payroll dashboard |
| `/admin/employees` | Employee management |
| `/admin/payroll` | Payroll runs |
| `/admin/login` | Admin sign-in (Supabase Auth) |

## Next priorities

1. Connect Supabase env vars on Vercel
2. Apply `supabase/migrations/001_mvp_schema.sql`
3. Replace mock data with real Supabase queries
4. Add Supabase Auth to `/admin/login`
