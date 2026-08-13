import {
  submissionFileSchema,
  MAX_SUBMISSION_BYTES,
} from "@/lib/validation/studentSchemas";

// Build a File with a controllable size without allocating megabytes of data:
// jsdom honors an overridden `size` getter for our schema's `file.size` checks.
function makeFile(
  name: string,
  type: string,
  size = 1_024,
): File {
  const file = new File(["x"], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

describe("submissionFileSchema", () => {
  it("accepts an allowed extension + MIME type within the size limit", () => {
    const result = submissionFileSchema.safeParse(
      makeFile("report.pdf", "application/pdf"),
    );
    expect(result.success).toBe(true);
  });

  it("rejects a disallowed file extension", () => {
    const result = submissionFileSchema.safeParse(
      makeFile("malware.exe", "application/octet-stream"),
    );
    expect(result.success).toBe(false);
  });

  it("rejects an allowed extension carrying a disallowed MIME type", () => {
    const result = submissionFileSchema.safeParse(
      makeFile("report.pdf", "image/png"),
    );
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.message === "That file type is not accepted")).toBe(true);
  });

  it("rejects a file larger than the maximum size", () => {
    const result = submissionFileSchema.safeParse(
      makeFile("report.pdf", "application/pdf", MAX_SUBMISSION_BYTES + 1),
    );
    expect(result.success).toBe(false);
  });

  it("rejects an empty file", () => {
    const result = submissionFileSchema.safeParse(
      makeFile("report.pdf", "application/pdf", 0),
    );
    expect(result.success).toBe(false);
    expect(result.error?.issues.some((i) => i.message === "The file is empty")).toBe(true);
  });

  it("rejects a value that is not a File", () => {
    const result = submissionFileSchema.safeParse("not-a-file");
    expect(result.success).toBe(false);
  });
});
