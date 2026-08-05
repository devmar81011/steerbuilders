import sharp from "sharp";
import { isHeicUpload } from "@/lib/upload-image-types";

const MAX_EDGE_PX = 2000;
const JPEG_QUALITY = 78;

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
    quality: 0.9,
  });
  return Buffer.from(output);
}

/** Resize + re-encode so portfolio uploads stay web-friendly. */
async function optimizeForWeb(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .rotate()
    .resize({
      width: MAX_EDGE_PX,
      height: MAX_EDGE_PX,
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: JPEG_QUALITY, progressive: true, mozjpeg: true })
    .toBuffer();
}

export async function normalizeUploadImage(
  buffer: Buffer,
  contentType: string,
  filename: string
): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
  let working = buffer;

  if (isHeicUpload(contentType, filename)) {
    working = await convertHeicToJpeg(buffer);
    if (!working.length) {
      throw new Error("HEIC conversion produced an empty image.");
    }
  }

  try {
    const optimized = await optimizeForWeb(working);
    if (optimized.length) {
      return {
        buffer: optimized,
        contentType: "image/jpeg",
        ext: "jpg",
      };
    }
  } catch {
    // Fall through — keep original bytes if sharp cannot decode.
  }

  if (isHeicUpload(contentType, filename)) {
    return {
      buffer: working,
      contentType: "image/jpeg",
      ext: "jpg",
    };
  }

  const ext =
    contentType === "image/png"
      ? "png"
      : contentType === "image/webp"
        ? "webp"
        : "jpg";

  return {
    buffer: working,
    contentType,
    ext,
  };
}
