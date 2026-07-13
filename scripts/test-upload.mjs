import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "fs";
import { resolve } from "path";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey =
  process.env.SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.TEST_ADMIN_EMAIL ?? "info@steerbuilderscorporation.com";
const password = process.env.TEST_ADMIN_PASSWORD;

// 1x1 red PNG
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

const storagePath = `projects/test-${Date.now()}.png`;
const results = [];

async function tryUpload(label, client) {
  const { data, error } = await client.storage
    .from("project-images")
    .upload(storagePath, png, {
      contentType: "image/png",
      upsert: true,
    });

  if (error) {
    results.push(`[${label}] FAIL: ${error.message}`);
    return false;
  }

  const { data: pub } = client.storage
    .from("project-images")
    .getPublicUrl(data.path);
  results.push(`[${label}] OK: ${pub.publicUrl}`);
  return true;
}

async function tryRestUpload(label, accessToken) {
  const response = await fetch(
    `${url}/storage/v1/object/project-images/${storagePath}`,
    {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "image/png",
        "x-upsert": "true",
      },
      body: new Uint8Array(png),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    results.push(`[${label}] FAIL (${response.status}): ${text}`);
    return false;
  }

  results.push(
    `[${label}] OK: ${url}/storage/v1/object/public/project-images/${storagePath}`
  );
  return true;
}

async function tryApiUpload(accessToken) {
  const boundary = `----test${Date.now()}`;
  const prefix = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test.png"\r\nContent-Type: image/png\r\n\r\n`;
  const suffix = `\r\n--${boundary}--\r\n`;
  const body = Buffer.concat([
    Buffer.from(prefix),
    png,
    Buffer.from(suffix),
  ]);

  const base = process.env.TEST_BASE_URL ?? "http://localhost:3000";
  const response = await fetch(`${base}/api/upload/project-image`, {
    method: "POST",
    headers: {
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
      Cookie: `sb-stoocngdvtgvbbvdjmdo-auth-token=${encodeURIComponent(
        JSON.stringify([
          accessToken,
          "refresh-token-placeholder",
          null,
          null,
          null,
        ])
      )}`,
    },
    body,
  });

  const text = await response.text();
  results.push(`[api route ${base}] ${response.status}: ${text}`);
}

async function main() {
  if (!url || !anonKey) {
    throw new Error("Missing Supabase env vars");
  }

  if (serviceKey) {
    const service = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    if (await tryUpload("service role", service)) {
      writeFileSync(resolve("scripts/test-upload-results.txt"), results.join("\n"));
      console.log(results.join("\n"));
      return;
    }
  } else {
    results.push("[service role] skipped");
  }

  if (!password) {
    results.push("[authenticated] skipped (no TEST_ADMIN_PASSWORD)");
    writeFileSync(resolve("scripts/test-upload-results.txt"), results.join("\n"));
    console.log(results.join("\n"));
    return;
  }

  const authed = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await authed.auth.signInWithPassword({ email, password });
  if (error) {
    results.push(`[sign in] FAIL: ${error.message}`);
    writeFileSync(resolve("scripts/test-upload-results.txt"), results.join("\n"));
    console.log(results.join("\n"));
    return;
  }

  const accessToken = data.session?.access_token;
  if (!accessToken) {
    results.push("[sign in] FAIL: no access token");
    writeFileSync(resolve("scripts/test-upload-results.txt"), results.join("\n"));
    console.log(results.join("\n"));
    return;
  }

  results.push("[sign in] OK");
  await tryUpload("supabase-js session", authed);
  await tryRestUpload("rest session", accessToken);
  await tryApiUpload(accessToken);

  writeFileSync(resolve("scripts/test-upload-results.txt"), results.join("\n"));
  console.log(results.join("\n"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
