# Changelog

All notable changes to Steer Builders. Format based on [Keep a Changelog](https://keepachangelog.com/).

## [0.3.0] - 2026-07-12

### Added
- Company content from official profile PDF (`src/lib/company-content.ts`)
- About page with management team bios
- Full portfolio page with filterable project table
- Proposal design system aligned with company profile tone and layout

### Changed
- Homepage rewritten with real SBC copy: story, vision, mission, services, featured projects
- Contact section uses official address, phone, and email
- Design system page expanded for client proposal use

## [0.2.0] - 2026-07-12

### Added
- MVP roadmap system (`src/lib/mvp-status.ts` + `/mvp` live status page)
- Admin payroll MVP: dashboard, employees, payroll pages
- Mock employee and payroll data for demo
- `MVP.md` living scope document
- Supabase migration SQL for MVP schema (`supabase/migrations/001_mvp_schema.sql`)
- Admin shell layout with sidebar navigation

### Changed
- Homepage and design system from v0.1.0

## [0.1.0] - 2026-07-12

### Added
- Initial Next.js + Tailwind project
- SBC brand design system (colors, Montserrat, UI components)
- Public homepage prototype
- Brand assets in `public/brand/`
- GitHub, Vercel, Supabase project wiring
