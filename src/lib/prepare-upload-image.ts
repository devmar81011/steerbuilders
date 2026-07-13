import { isHeicUpload } from "@/lib/upload-image-types";

/** Convert iPhone HEIC photos to JPEG in the browser before upload. */
export async function prepareUploadImageFile(file: File): Promise<File> {
  if (!isHeicUpload(file.type || "", file.name)) {
    return file;
  }

  const heic2any = (await import("heic2any")).default;
  const result = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.9,
  });

  const blob = Array.isArray(result) ? result[0] : result;
  const baseName = file.name.replace(/\.(heic|heif)$/i, "") || "photo";

  return new File([blob], `${baseName}.jpg`, {
    type: "image/jpeg",
    lastModified: file.lastModified,
  });
}
