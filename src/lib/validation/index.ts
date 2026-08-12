import { z } from "zod";
import {
  changePasswordSchema,
  loginSchema,
  verifyEmailSchema,
} from "./schemas";
import {
  classSchema,
  createUserSchema,
  enrollmentSchema,
  subjectSchema,
  teacherAssignmentSchema,
} from "./adminSchemas";

export * from "./schemas";
export * from "./adminSchemas";

export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailOtpInput = z.infer<typeof verifyEmailSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type ClassInput = z.infer<typeof classSchema>;
export type SubjectInput = z.infer<typeof subjectSchema>;
export type TeacherAssignmentInput = z.infer<typeof teacherAssignmentSchema>;
export type EnrollmentInput = z.infer<typeof enrollmentSchema>;