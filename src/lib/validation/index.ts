import { z } from "zod";
import {
  changePasswordSchema,
  loginSchema,
  verifyEmailSchema,
} from "./schemas";

export * from "./schemas";

export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailOtpInput = z.infer<typeof verifyEmailSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;