import { resolveAuthRedirect } from "@/lib/auth/redirect";
import type { AuthUser } from "@/context/AuthContext";

const student: AuthUser = { id: "u1", email: "student@example.com", role: "Student" };

describe("resolveAuthRedirect", () => {
  it("returns null while loading (decision undecided)", () => {
    expect(resolveAuthRedirect("loading", null, null)).toBeNull();
  });

  it("redirects unauthenticated users to /login", () => {
    expect(resolveAuthRedirect("unauthenticated", null, null)).toBe("/login");
  });

  it("routes requires-action + VerifyEmail to /verify-email", () => {
    expect(resolveAuthRedirect("requires-action", "VerifyEmail", null)).toBe(
      "/verify-email",
    );
  });

  it("routes requires-action + ChangePassword to /change-password", () => {
    expect(
      resolveAuthRedirect("requires-action", "ChangePassword", null),
    ).toBe("/change-password");
  });

  it("falls back to /login for requires-action with a null forceAction", () => {
    expect(resolveAuthRedirect("requires-action", null, null)).toBe("/login");
  });

  it("returns null for an authenticated user whose role is allowed", () => {
    expect(resolveAuthRedirect("authenticated", null, student, ["Student"])).toBeNull();
  });

  it("returns null for an authenticated user when no roles are required", () => {
    expect(resolveAuthRedirect("authenticated", null, student)).toBeNull();
  });

  it("redirects an authenticated user whose role is not allowed to /forbidden", () => {
    expect(
      resolveAuthRedirect("authenticated", null, student, ["Teacher"]),
    ).toBe("/forbidden");
  });

  it("redirects to /forbidden when roles are required but the user has none", () => {
    expect(resolveAuthRedirect("authenticated", null, null, ["Student"])).toBe(
      "/forbidden",
    );
  });
});
