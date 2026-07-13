import sharp from "sharp";
import { isHeicUpload } from "@/lib/upload-image-types";

const STORED_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function normalizeUploadImage(
  buffer: Buffer,
  contentType: string,
  filename: string
): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
  if (isHeicUpload(contentType, filename)) {
    const converted = await sharp(buffer).rotate().jpeg({ quality: 90 }).toBuffer();
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
