import { assignmentSchema } from "@/lib/validation/teacherSchemas";

// Seeded/back-end GUIDs are not always valid RFC-4122 v4 UUIDs. These must be
// accepted — zod v4's strict `z.uuid()` rejected them, so a real subject/class
// selection still failed with "Select a subject".
const NON_V4_GUID = "55555555-5555-5555-5555-555555555555";
const V4_GUID = "a1b2c3d4-e5f6-4a1b-8c2d-0123456789ab";

const validBase = {
  title: "Chapter 3 problem set",
  description: "Do the odd-numbered questions.",
  deadline: "2026-12-31T23:59",
  maxMarks: 100,
  allowResubmissionUntilDeadline: false,
};

describe("assignmentSchema", () => {
  it("accepts generic (non-v4) GUIDs for subjectId and classId", () => {
    const result = assignmentSchema.safeParse({
      ...validBase,
      subjectId: NON_V4_GUID,
      classId: V4_GUID,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a blank subject with a friendly message", () => {
    const result = assignmentSchema.safeParse({
      ...validBase,
      subjectId: "",
      classId: NON_V4_GUID,
    });
    expect(result.success).toBe(false);
    const subjectIssue = result.error?.issues.find((i) =>
      i.path.includes("subjectId"),
    );
    expect(subjectIssue?.message).toBe("Select a subject");
  });
});
