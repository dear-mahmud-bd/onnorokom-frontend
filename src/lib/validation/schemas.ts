import { z } from "zod";

export const OTP_CODE_LENGTH = 6;

export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 128;
export const PASSWORD_UPPERCASE_REQUIRED = /[A-Z]/;
export const PASSWORD_LOWERCASE_REQUIRED = /[a-z]/;
export const PASSWORD_DIGIT_REQUIRED = /\d/;
export const PASSWORD_SYMBOL_REQUIRED = /[^A-Za-z0-9]/;

export const loginSchema = z.object({
  email: z.email({ message: "Enter a valid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
});

export const verifyEmailSchema = z.object({
  code: z
    .string()
    .length(OTP_CODE_LENGTH, {
      message: `Code must be exactly ${OTP_CODE_LENGTH} digits`,
    })
    .regex(/^\d+$/, { message: "Code must contain only digits" }),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, {
    message: "Current password is required",
  }),
  newPassword: z
    .string()
    .min(PASSWORD_MIN_LENGTH, {
      message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`,
    })
    .max(PASSWORD_MAX_LENGTH, {
      message: `Password must be at most ${PASSWORD_MAX_LENGTH} characters long`,
    })
    .regex(PASSWORD_UPPERCASE_REQUIRED, {
      message: "Password must contain at least one uppercase letter",
    })
    .regex(PASSWORD_LOWERCASE_REQUIRED, {
      message: "Password must contain at least one lowercase letter",
    })
    .regex(PASSWORD_DIGIT_REQUIRED, {
      message: "Password must contain at least one digit",
    })
    .regex(PASSWORD_SYMBOL_REQUIRED, {
      message: "Password must contain at least one symbol",
    }),
});