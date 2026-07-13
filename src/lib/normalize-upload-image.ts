import { isHeicUpload } from "@/lib/upload-image-types";

const STORED_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

type HeicConvertFn = (options: {
  buffer: ArrayBuffer | Buffer;
  format: "JPEG" | "PNG";
  quality?: number;
}) => Promise<ArrayBuffer>;

async function convertHeicToJpeg(buffer: Buffer): Promise<Buffer> {
  // Sharp's prebuilt binaries cannot decode HEVC/HEIC (patent-encumbered).
  // Always use heic-convert for real iPhone HEIC files.
  const mod = await import("heic-convert");
  const convert = (mod.default ?? mod) as HeicConvertFn;
  const output = await convert({
    buffer,
    format: "JPEG",
    quality: 0.92,
  });
  return Buffer.from(output);
}

export async function normalizeUploadImage(
  buffer: Buffer,
  contentType: string,
  filename: string
): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
  if (isHeicUpload(contentType, filename)) {
    const converted = await convertHeicToJpeg(buffer);
    if (!converted.length) {
      throw new Error("HEIC conversion produced an empty image.");
    }
    return {
      buffer: converted,
      contentType: "image/jpeg",
      ext: "jpg",
    };
  }

  return {
    buffer,
    contentType,
    ext: STORED_EXT[contentType] ?? "jpg",
  };
}
