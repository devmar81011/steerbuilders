import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/require-admin";
import { getSupabaseEnv } from "@/lib/supabase/config";
import { createServiceClient } from "@/lib/supabase/service";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

const BUCKET = "project-images";

function resolveContentType(file: File): string | null {
  if (file.type && ALLOWED_TYPES.has(file.type)) {
    return file.type === "image/jpg" ? "image/jpeg" : file.type;
  }

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext) return null;

  const mime = EXT_TO_MIME[ext];
  return mime ?? null;
}

async function uploadWithSession(
  storagePath: string,
  buffer: Buffer,
  contentType: string,
  accessToken: string
) {
  const env = getSupabaseEnv();
  if (!env) {
    return { error: "Supabase is not configured." };
  }

  const response = await fetch(
    `${env.url}/storage/v1/object/${BUCKET}/${storagePath}`,
    {
      method: "POST",
      headers: {
        apikey: env.key,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": contentType,
        "x-upsert": "false",
      },
      body: new Uint8Array(buffer),
    }
  );

  if (!response.ok) {
    let message = `Storage upload failed (${response.status}).`;
    try {
      const payload = (await response.json()) as { message?: string; error?: string };
      message = payload.message ?? payload.error ?? message;
    } catch {
      // Keep generic message when storage returns non-JSON.
    }
    return { error: message };
  }

  return { error: null as string | null };
}

export async function POST(request: NextRequest) {
  const admin = await requireAdminApi(request);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }

    const contentType = resolveContentType(file);
    if (!contentType) {
      return NextResponse.json(
        { error: "Only JPG, PNG, and WebP images are allowed." },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File must be under 5 MB." }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filename = `${randomUUID()}.${ext}`;
    const storagePath = `projects/${filename}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const serviceClient = createServiceClient();
    if (serviceClient) {
      const { error: uploadError } = await serviceClient.storage
        .from(BUCKET)
        .upload(storagePath, buffer, {
          contentType,
          upsert: false,
        });

      if (uploadError) {
        return NextResponse.json({ error: uploadError.message }, { status: 500 });
      }
    } else {
      const accessToken = admin.accessToken;

      if (!accessToken) {
        return NextResponse.json(
          { error: "Session expired. Sign out and sign in again." },
          { status: 401 }
        );
      }

      const { error } = await uploadWithSession(
        storagePath,
        buffer,
        contentType,
        accessToken
      );

      if (error) {
        return NextResponse.json({ error }, { status: 500 });
      }
    }

    const env = getSupabaseEnv();
    const publicUrl = env
      ? `${env.url}/storage/v1/object/public/${BUCKET}/${storagePath}`
      : `/${BUCKET}/${storagePath}`;

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
