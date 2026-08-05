/** Canonical production domain for Steer Builders Corporation. */
export const SITE_HOST = "steerbuilderscorporation.com" as const;
export const SITE_WWW_HOST = `www.${SITE_HOST}` as const;
export const SITE_URL = `https://${SITE_HOST}` as const;

/** Legacy Vercel hosts kept for preview / rollback; not the public brand URL. */
export const LEGACY_VERCEL_HOSTS = [
  "steerbuilders.vercel.app",
  "steerbuilders-psi.vercel.app",
] as const;

export function getSiteUrl() {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) {
    try {
      return new URL(fromEnv).origin;
    } catch {
      /* fall through */
    }
  }
  return SITE_URL;
}

export function getSiteHost() {
  return new URL(getSiteUrl()).host;
}
