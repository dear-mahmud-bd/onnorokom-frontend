import { z } from "zod";

// Client-side file guard for student submissions. These mirror the backend
// FileStorageOptions defaults; the server re-validates (incl. magic-byte
// checks), so this is a first-line UX guard, not the source of truth.
export const ALLOWED_SUBMISSION_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".txt",
] as const;

export const ALLOWED_SUBMISSION_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
] as const;

export const MAX_SUBMISSION_BYTES = 10 * 1024 * 1024;

function hasAllowedExtension(name: string): boolean {
  const lower = name.toLowerCase();
  return ALLOWED_SUBMISSION_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export const submissionFileSchema = z
  .instanceof(File, { message: "Choose a file to upload" })
  .refine((file) => file.size > 0, { message: "The file is empty" })
  .refine((file) => file.size <= MAX_SUBMISSION_BYTES, {
    message: `File must be ${MAX_SUBMISSION_BYTES / (1024 * 1024)} MB or smaller`,
  })
  .refine((file) => hasAllowedExtension(file.name), {
    message: `Allowed file types: ${ALLOWED_SUBMISSION_EXTENSIONS.join(", ")}`,
  })
  .refine(
    (file) =>
      (ALLOWED_SUBMISSION_MIME_TYPES as readonly string[]).includes(file.type),
    { message: "That file type is not accepted" },
  );
