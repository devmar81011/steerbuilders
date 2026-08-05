# Custom domain — steerbuilderscorporation.com

The public site and admin app use **https://steerbuilderscorporation.com** as the canonical host.

Code already points metadata, Open Graph, sitemap, robots, and `NEXT_PUBLIC_ADMIN_HOST` at this domain. Finish the platform steps below so the domain resolves with HTTPS.

## 1. Vercel Domains

Project: [steerbuilders](https://vercel.com/mar81011s-projects/steerbuilders/settings/domains)

1. Add `steerbuilderscorporation.com`
2. Add `www.steerbuilderscorporation.com`
3. Set the **apex** (`steerbuilderscorporation.com`) as Primary
4. Keep `*.vercel.app` attached for previews

`www` permanently redirects to the apex via `vercel.json`.

## 2. DNS (at the registrar)

Use the exact records Vercel shows. Typical values:

| Host | Type | Value |
|------|------|--------|
| `@` | A | `76.76.21.21` |
| `www` | CNAME | `cname.vercel-dns.com` |

Wait until both hostnames show **Valid** SSL in Vercel.

## 3. Vercel env (Production)

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_SITE_URL` | `https://steerbuilderscorporation.com` |
| `NEXT_PUBLIC_ADMIN_HOST` | `steerbuilderscorporation.com` |

Redeploy after saving.

## 4. Supabase Auth URLs

Project: [stoocngdvtgvbbvdjmdo](https://supabase.com/dashboard/project/stoocngdvtgvbbvdjmdo/auth/url-configuration)

- **Site URL:** `https://steerbuilderscorporation.com`
- **Redirect URLs:**  
  - `https://steerbuilderscorporation.com/**`  
  - `https://www.steerbuilderscorporation.com/**`  
  - (optional) existing `*.vercel.app/**` for preview admin

## 5. Smoke check

- https://steerbuilderscorporation.com — homepage
- https://www.steerbuilderscorporation.com — redirects to apex
- https://steerbuilderscorporation.com/admin — login
- https://steerbuilderscorporation.com/sitemap.xml
- https://steerbuilderscorporation.com/robots.txt
