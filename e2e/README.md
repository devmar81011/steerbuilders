# Playwright E2E

Quality checks for client presentation. Runs against a production build (`next start`) by default.

## Commands

```bash
# Build the app first (required for local webServer)
npm run build

# Full suite (public + admin gate + Saturday period unit checks)
npm run test:e2e

# Public + unit only (no admin password needed)
npm run test:e2e:public

# Open HTML report after a run
npm run test:e2e:report
```

## Authenticated admin tests

Local `npm run test:e2e` uses a **Playwright-only** admin bypass (`E2E_ADMIN_BYPASS_SECRET`) so Home → Payroll → Projects run without the real Supabase password. The bypass is disabled when `VERCEL_ENV=production` and returns 404 if the secret is unset.

To exercise real Supabase login instead:

```bash
export TEST_ADMIN_EMAIL="info@steerbuilderscorporation.com"
export TEST_ADMIN_PASSWORD="your-admin-password"
npm run test:e2e
```

Against a remote `PLAYWRIGHT_BASE_URL` without `TEST_ADMIN_PASSWORD`, authenticated admin tests are skipped unless that host also has `E2E_ADMIN_BYPASS_SECRET` set (never on production).

## Against production

```bash
PLAYWRIGHT_BASE_URL=https://steerbuilders.vercel.app npm run test:e2e:public
```
