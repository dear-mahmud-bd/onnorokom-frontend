import { z } from "zod";
import { SubmissionStatus } from "@/types";

export const TITLE_MAX_LENGTH = 200;
export const DESCRIPTION_MAX_LENGTH = 4000;

export const assignmentSchema = z.object({
  title: z
    .string()
    .min(1, { message: "Title is required" })
    .max(TITLE_MAX_LENGTH, {
      message: `Title must be at most ${TITLE_MAX_LENGTH} characters long`,
    }),
  description: z
    .string()
    .min(1, { message: "Description is required" })
    .max(DESCRIPTION_MAX_LENGTH, {
      message: `Description must be at most ${DESCRIPTION_MAX_LENGTH} characters long`,
    }),
  // IDs come from the backend as generic GUIDs (e.g. seeded values like
  // 55555555-5555-...), which are NOT valid RFC-4122 UUIDs. zod v4's `z.uuid()`
  // is strict about the version/variant nibbles and would reject them (leaving
  // "Select a subject" showing even after a real selection), so use `z.guid()`
  // which only checks the 8-4-4-4-12 hex GUID shape.
  subjectId: z.guid({ message: "Select a subject" }),
  classId: z.guid({ message: "Select a class" }),
  deadline: z
    .string()
    .min(1, { message: "Deadline is required" })
    .refine((value) => !Number.isNaN(Date.parse(value)), {
      message: "Enter a valid deadline",
    }),
  maxMarks: z
    .number({ message: "Max marks is required" })
    .positive({ message: "Max marks must be greater than zero" }),
  allowResubmissionUntilDeadline: z.boolean(),
});

export const gradeSchema = z.object({
  marks: z
    .number({ message: "Marks are required" })
    .min(0, { message: "Marks cannot be negative" }),
  feedback: z.string().max(DESCRIPTION_MAX_LENGTH).optional(),
});

export const statusSchema = z.object({
  newStatus: z.union(
    [
      z.literal(SubmissionStatus.Submitted),
      z.literal(SubmissionStatus.Late),
      z.literal(SubmissionStatus.UnderReview),
      z.literal(SubmissionStatus.Graded),
      z.literal(SubmissionStatus.ReturnedForResubmission),
    ],
    { message: "Select a status" },
  ),
});
