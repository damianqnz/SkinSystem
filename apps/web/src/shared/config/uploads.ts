// Single source of truth for upload constraints.
// next.config.js bodySizeLimit must match UPLOAD_MAX_BYTES (documented there).
export const UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
export const UPLOAD_MAX_MB    = 5;

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/svg+xml',
] as const;

type UploadValidationResult =
  | { ok: true }
  | { ok: false; reason: 'TOO_LARGE' | 'INVALID_TYPE' };

export function isValidImageFile(file: File): UploadValidationResult {
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return { ok: false, reason: 'INVALID_TYPE' };
  }
  if (file.size > UPLOAD_MAX_BYTES) {
    return { ok: false, reason: 'TOO_LARGE' };
  }
  return { ok: true };
}
