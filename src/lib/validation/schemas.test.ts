import {
  loginSchema,
  verifyEmailSchema,
  changePasswordSchema,
  OTP_CODE_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "@/lib/validation/schemas";

// A password that satisfies every strength rule; individual tests break one
// rule at a time by mutating it.
const VALID_PASSWORD = "Str0ng!Passw0rd";

describe("loginSchema", () => {
  it("accepts a valid email + non-empty password", () => {
    const result = loginSchema.safeParse({
      email: "student@example.com",
      password: "anything",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "anything",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Enter a valid email address");
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({
      email: "student@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Password is required");
  });
});

describe("verifyEmailSchema", () => {
  it("accepts a 6-digit numeric code", () => {
    const result = verifyEmailSchema.safeParse({ code: "123456" });
    expect(result.success).toBe(true);
  });

  it("rejects a code of the wrong length", () => {
    const result = verifyEmailSchema.safeParse({ code: "12345" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      `Code must be exactly ${OTP_CODE_LENGTH} digits`,
    );
  });

  it("rejects a code containing non-digit characters", () => {
    const result = verifyEmailSchema.safeParse({ code: "12345a" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "Code must contain only digits",
    );
  });
});

describe("changePasswordSchema", () => {
  function parse(newPassword: string) {
    return changePasswordSchema.safeParse({
      currentPassword: "current-secret",
      newPassword,
    });
  }

  it("accepts a strong new password", () => {
    expect(parse(VALID_PASSWORD).success).toBe(true);
  });

  it("rejects an empty current password", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "",
      newPassword: VALID_PASSWORD,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "Current password is required",
    );
  });

  it("rejects a new password shorter than the minimum length", () => {
    const result = parse("Aa1!aa");
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`,
    );
  });

  it("rejects a new password missing an uppercase letter", () => {
    const result = parse("str0ng!passw0rd");
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "Password must contain at least one uppercase letter",
    );
  });

  it("rejects a new password missing a lowercase letter", () => {
    const result = parse("STR0NG!PASSW0RD");
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "Password must contain at least one lowercase letter",
    );
  });

  it("rejects a new password missing a digit", () => {
    const result = parse("Strong!Password");
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "Password must contain at least one digit",
    );
  });

  it("rejects a new password missing a symbol", () => {
    const result = parse("Str0ngPassw0rd");
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "Password must contain at least one symbol",
    );
  });
});
