import { render, screen } from "@testing-library/react";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useAuth } from "@/context/AuthContext";

const mockReplace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock("@/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = useAuth as jest.Mock;

// Only the three fields RequireAuth reads are needed; the rest of the context
// value is irrelevant to the guard decision.
function setAuth(value: {
  status: string;
  forceAction?: string | null;
  user?: { id: string; email: string; role?: string } | null;
}) {
  mockUseAuth.mockReturnValue({
    forceAction: null,
    user: null,
    ...value,
  });
}

beforeEach(() => {
  mockReplace.mockClear();
  mockUseAuth.mockReset();
});

describe("RequireAuth", () => {
  it("renders children when the user is authenticated and allowed", () => {
    setAuth({
      status: "authenticated",
      user: { id: "u1", email: "s@example.com", role: "Student" },
    });

    render(
      <RequireAuth allowedRoles={["Student"]}>
        <p>protected content</p>
      </RequireAuth>,
    );

    expect(screen.getByText("protected content")).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("shows the loading spinner without redirecting while status is loading", () => {
    setAuth({ status: "loading" });

    render(
      <RequireAuth>
        <p>protected content</p>
      </RequireAuth>,
    );

    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText("protected content")).not.toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("redirects an unauthenticated user to /login and withholds children", () => {
    setAuth({ status: "unauthenticated" });

    render(
      <RequireAuth>
        <p>protected content</p>
      </RequireAuth>,
    );

    expect(mockReplace).toHaveBeenCalledWith("/login");
    expect(screen.queryByText("protected content")).not.toBeInTheDocument();
  });
});
