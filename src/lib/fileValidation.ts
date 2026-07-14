export const MAX_UPLOAD_FILE_SIZE_MB = 10
export const MAX_UPLOAD_FILE_SIZE_BYTES = MAX_UPLOAD_FILE_SIZE_MB * 1024 * 1024

export function isValidFileSize(
  file: File,
  maxBytes = MAX_UPLOAD_FILE_SIZE_BYTES
): boolean {
  return file.size <= maxBytes
}
