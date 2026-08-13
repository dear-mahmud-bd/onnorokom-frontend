import { z } from "zod";
import { AdminUserRole } from "@/types";

export const FULL_NAME_MAX_LENGTH = 100;

export const createUserSchema = z.object({
  fullName: z
    .string()
    .min(1, { message: "Full name is required" })
    .max(FULL_NAME_MAX_LENGTH, {
      message: `Full name must be at most ${FULL_NAME_MAX_LENGTH} characters long`,
    }),
  email: z.email({ message: "Enter a valid email address" }),
  role: z.union(
    [z.literal(AdminUserRole.Teacher), z.literal(AdminUserRole.Student)],
    { message: "Select a role" },
  ),
});

export const classSchema = z.object({
  name: z.string().min(1, { message: "Class name is required" }),
  gradeLevel: z.string().min(1, { message: "Grade level is required" }),
});

export const subjectSchema = z.object({
  name: z.string().min(1, { message: "Subject name is required" }),
  code: z.string().min(1, { message: "Subject code is required" }),
});

// IDs come from the backend as generic GUIDs (e.g. seeded values like
// 11111111-1111-...), which are NOT valid RFC-4122 UUIDs. zod v4's `z.uuid()`
// is strict about the version/variant nibbles and would reject them, so use
// `z.guid()` which only checks the 8-4-4-4-12 hex GUID shape.
export const teacherAssignmentSchema = z.object({
  teacherId: z.guid({ message: "Select a teacher" }),
  subjectId: z.guid({ message: "Select a subject" }),
  classId: z.guid({ message: "Select a class" }),
});

export const enrollmentSchema = z.object({
  studentId: z.guid({ message: "Select a student" }),
  classId: z.guid({ message: "Select a class" }),
});
