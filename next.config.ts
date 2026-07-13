import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["heic-convert", "heic-decode", "libheif-js"],
  env: {
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL ??
      "https://stoocngdvtgvbbvdjmdo.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      "sb_publishable_DRiclP8oRtQvspRQ2rPelg_OcVtpSNs",
    NEXT_PUBLIC_ADMIN_HOST:
      process.env.NEXT_PUBLIC_ADMIN_HOST ?? "steerbuilders.vercel.app",
  },
};

export default nextConfig;
