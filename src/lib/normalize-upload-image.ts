import sharp from "sharp";
import { isHeicUpload } from "@/lib/upload-image-types";

const STORED_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

type HeicConvertFn = (options: {
  buffer: Buffer;
  format: "JPEG" | "PNG";
  quality?: number;
}) => Promise<ArrayBuffer>;

async function convertHeicToJpeg(buffer: Buffer): Promise<Buffer> {
  try {
    return await sharp(buffer).rotate().jpeg({ quality: 90 }).toBuffer();
  } catch {
    const mod = await import("heic-convert");
    const convert = (mod.default ?? mod) as HeicConvertFn;
    const output = await convert({
      buffer,
      format: "JPEG",
      quality: 0.92,
    });
    return Buffer.from(output);
  }
}

export async function normalizeUploadImage(
  buffer: Buffer,
  contentType: string,
  filename: string
): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
  if (isHeicUpload(contentType, filename)) {
    const converted = await convertHeicToJpeg(buffer);
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
