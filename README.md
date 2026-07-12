# Steer Builders Corporation

Website and admin payroll system for **Steer Builders Corporation (SBC)**.

- **GitHub:** https://github.com/devmar81011/steerbuilders
- **Vercel:** https://vercel.com/mar-projects81011/steerbuilders
- **Supabase:** https://supabase.com/dashboard/project/stoocngdvtgvbbvdjmdo
- **MVP status:** `/mvp` (live roadmap)
- **Stack:** Next.js, Tailwind CSS, Supabase, Vercel

## MVP

See **[MVP.md](./MVP.md)** for scope and **[CHANGELOG.md](./CHANGELOG.md)** for release history.

| Route | Description |
|-------|-------------|
| `/` | Public homepage |
| `/design-system` | Brand & UI kit (hidden — `/design-system` direct URL) |
| `/mvp` | Live roadmap (auto-synced from code) |
| `/admin` | Payroll dashboard |
| `/admin/employees` | Employee management |
| `/admin/payroll` | Payroll runs |

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Add your Supabase anon key to `.env.local` from **Supabase → Project Settings → API**.

## Deploy & keep updated

1. **Push to `main`** on GitHub → Vercel auto-deploys
2. After each feature, update:
   - `src/lib/mvp-status.ts` — feature status
   - `CHANGELOG.md` — what changed
   - `MVP.md` — checklist
3. Add env vars in [Vercel settings](https://vercel.com/mar-projects81011/steerbuilders/settings/environment-variables):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Database

Apply the MVP schema from `supabase/migrations/001_mvp_schema.sql` in the Supabase SQL editor.

## Brand assets

Logos and style guide live in `public/brand/`.
