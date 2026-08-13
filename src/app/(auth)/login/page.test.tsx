import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "@/app/(auth)/login/page";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api/client";

const mockLogin = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));

jest.mock("@/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  // Unauthenticated so the form renders (no redirect to /dashboard).
  mockUseAuth.mockReturnValue({ status: "unauthenticated", login: mockLogin });
});

async function fillCredentials(
  user: ReturnType<typeof userEvent.setup>,
  email: string,
  password: string,
) {
  await user.type(screen.getByLabelText("Email"), email);
  await user.type(screen.getByLabelText("Password"), password);
}

describe("LoginPage", () => {
  it("blocks submission and shows a field error for an invalid email", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    await fillCredentials(user, "not-an-email", "some-password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(
      await screen.findByText("Enter a valid email address"),
    ).toBeInTheDocument();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("calls login with the entered credentials on a valid submit", async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue(undefined);
    render(<LoginPage />);

    await fillCredentials(user, "student@example.com", "s3cret-pass");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(mockLogin).toHaveBeenCalledWith(
      "student@example.com",
      "s3cret-pass",
    );
  });

  it("surfaces a non-401 server error via the ServerErrorBanner", async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValue(
      new ApiError(500, { status: 500, title: "Server exploded" }),
    );
    render(<LoginPage />);

    await fillCredentials(user, "student@example.com", "s3cret-pass");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Server exploded")).toBeInTheDocument();
  });

  it("shows the invalid-credentials banner on a 401 response", async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValue(
      new ApiError(401, { status: 401, title: "Unauthorized" }),
    );
    render(<LoginPage />);

    await fillCredentials(user, "student@example.com", "wrong-pass");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(
      await screen.findByText("Invalid email or password. Please try again."),
    ).toBeInTheDocument();
  });
});
