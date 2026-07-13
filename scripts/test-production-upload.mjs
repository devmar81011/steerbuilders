import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const url = "https://stoocngdvtgvbbvdjmdo.supabase.co";
const key = "sb_publishable_DRiclP8oRtQvspRQ2rPelg_OcVtpSNs";
const email = "info@steerbuilderscorporation.com";
const password = process.env.TEST_ADMIN_PASSWORD;
const baseUrl = process.env.TEST_BASE_URL ?? "https://steerbuilders.vercel.app";

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

const lines = [];

async function main() {
  if (!password) {
    lines.push("Missing TEST_ADMIN_PASSWORD");
    writeFileSync(resolve("scripts/test-results.txt"), lines.join("\n"));
    console.log(lines.join("\n"));
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const signIn = await supabase.auth.signInWithPassword({ email, password });
  if (signIn.error || !signIn.data.session) {
    lines.push(`sign-in failed: ${signIn.error?.message ?? "no session"}`);
    writeFileSync(resolve("scripts/test-results.txt"), lines.join("\n"));
    console.log(lines.join("\n"));
    process.exit(1);
  }

  const token = signIn.data.session.access_token;
  lines.push("sign-in OK");

  const boundary = `----test${Date.now()}`;
  const body = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test.png"\r\nContent-Type: image/png\r\n\r\n`
    ),
    png,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  const noAuth = await fetch(`${baseUrl}/api/upload/project-image`, {
    method: "POST",
    headers: { "Content-Type": `multipart/form-data; boundary=${boundary}` },
    body,
  });
  lines.push(`api no auth: ${noAuth.status} ${await noAuth.text()}`);

  const withBearer = await fetch(`${baseUrl}/api/upload/project-image`, {
    method: "POST",
    headers: {
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
      Authorization: `Bearer ${token}`,
    },
    body,
  });
  lines.push(`api bearer: ${withBearer.status} ${await withBearer.text()}`);

  writeFileSync(resolve("scripts/test-results.txt"), lines.join("\n"));
  console.log(lines.join("\n"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
