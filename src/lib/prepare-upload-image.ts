import { isHeicUpload } from "@/lib/upload-image-types";

/**
 * Convert iPhone HEIC/HEIF to JPEG in the browser when possible.
 * If conversion fails, return the original file so the server can convert it.
 */
export async function prepareUploadImageFile(file: File): Promise<File> {
  if (!isHeicUpload(file.type || "", file.name)) {
    return file;
  }

  try {
    const heic2any = (await import("heic2any")).default;
    const result = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.9,
    });

    const blob = Array.isArray(result) ? result[0] : result;
    if (!blob || blob.size === 0) {
      return file;
    }

    const baseName = file.name.replace(/\.(heic|heif)$/i, "") || "photo";
    return new File([blob], `${baseName}.jpg`, {
      type: "image/jpeg",
      lastModified: file.lastModified,
    });
  } catch {
    // Browser converters are unreliable; server uses heic-convert.
    return file;
  }
}
