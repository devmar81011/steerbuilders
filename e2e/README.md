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

Set credentials to exercise Home → Payroll → Projects after login:

```bash
export TEST_ADMIN_EMAIL="info@steerbuilderscorporation.com"
export TEST_ADMIN_PASSWORD="your-admin-password"
npm run test:e2e
```

Without `TEST_ADMIN_PASSWORD`, authenticated admin tests are skipped; login gate + invalid-credentials tests still run.

## Against production

```bash
PLAYWRIGHT_BASE_URL=https://steerbuilders.vercel.app npm run test:e2e:public
```
