export const MAX_PROJECT_IMAGE_BYTES = 20 * 1024 * 1024;
export const MAX_PROJECT_IMAGE_LABEL = "20 MB";

export const UPLOAD_IMAGE_ACCEPT =
  "image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif";

const UPLOAD_IMAGE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "heic",
  "heif",
]);

const UPLOAD_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
  heif: "image/heif",
};

export function isAllowedUploadImage(file: File): boolean {
  if (file.type && UPLOAD_IMAGE_MIME_TYPES.has(file.type)) {
    return true;
  }

  const ext = file.name.split(".").pop()?.toLowerCase();
  return ext ? UPLOAD_IMAGE_EXTENSIONS.has(ext) : false;
}

export function resolveUploadContentType(file: File): string | null {
  if (file.type && UPLOAD_IMAGE_MIME_TYPES.has(file.type)) {
    return file.type === "image/jpg" ? "image/jpeg" : file.type;
  }

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext) return null;

  return EXT_TO_MIME[ext] ?? null;
}

export function isHeicUpload(contentType: string, filename: string): boolean {
  if (contentType === "image/heic" || contentType === "image/heif") {
    return true;
  }

  const ext = filename.split(".").pop()?.toLowerCase();
  return ext === "heic" || ext === "heif";
}
