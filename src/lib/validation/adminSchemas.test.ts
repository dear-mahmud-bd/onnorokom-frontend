import {
  teacherAssignmentSchema,
  enrollmentSchema,
} from "@/lib/validation/adminSchemas";

// Seeded/back-end GUIDs are not always valid RFC-4122 v4 UUIDs. These must be
// accepted — zod v4's strict `z.uuid()` rejected them, breaking the forms.
const NON_V4_GUID = "11111111-1111-1111-1111-111111111111";
const V4_GUID = "a1b2c3d4-e5f6-4a1b-8c2d-0123456789ab";

describe("teacherAssignmentSchema", () => {
  it("accepts generic (non-v4) GUIDs for all three ids", () => {
    const result = teacherAssignmentSchema.safeParse({
      teacherId: NON_V4_GUID,
      subjectId: NON_V4_GUID,
      classId: V4_GUID,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a blank selection with a friendly message", () => {
    const result = teacherAssignmentSchema.safeParse({
      teacherId: "",
      subjectId: NON_V4_GUID,
      classId: NON_V4_GUID,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Select a teacher");
  });
});

describe("enrollmentSchema", () => {
  it("accepts generic (non-v4) GUIDs", () => {
    const result = enrollmentSchema.safeParse({
      studentId: NON_V4_GUID,
      classId: NON_V4_GUID,
    });
    expect(result.success).toBe(true);
  });
});
