import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminUsersPage from "@/app/(app)/admin/users/page";
import { listUsers, setUserActive } from "@/lib/api/users";
import { UserRole } from "@/types";
import type { UserSummaryResponse } from "@/types";

jest.mock("@/lib/api/users", () => ({
  listUsers: jest.fn(),
  setUserActive: jest.fn(),
  createUser: jest.fn(),
}));
jest.mock("@/lib/api/token", () => ({
  sessionTokenProvider: jest.fn(() => "test-token"),
}));

const mockList = listUsers as jest.Mock;
const mockSetActive = setUserActive as jest.Mock;

function user(overrides: Partial<UserSummaryResponse> = {}): UserSummaryResponse {
  return {
    id: "u1",
    fullName: "Demo Teacher",
    email: "teacher@demo.local",
    role: UserRole.Teacher,
    isActive: true,
    isEmailVerified: true,
    createdAt: "2026-08-01T00:00:00Z",
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("AdminUsersPage", () => {
  it("renders the user list from the API", async () => {
    mockList.mockResolvedValue([user()]);

    render(<AdminUsersPage />);

    expect(await screen.findByText("teacher@demo.local")).toBeInTheDocument();
    // Scope to the users table — "Teacher" also appears as a create-form option.
    const table = screen.getByRole("table");
    expect(within(table).getByText("Teacher")).toBeInTheDocument();
    expect(within(table).getByText("Active")).toBeInTheDocument();
  });

  it("deactivates a user after confirmation and refetches", async () => {
    const activeUser = user();
    mockList
      .mockResolvedValueOnce([activeUser])
      .mockResolvedValueOnce([{ ...activeUser, isActive: false }]);
    mockSetActive.mockResolvedValue(undefined);

    render(<AdminUsersPage />);
    await screen.findByText("teacher@demo.local");

    await userEvent.setup().click(
      screen.getByRole("button", { name: "Deactivate" }),
    );

    // Confirm in the dialog.
    const dialog = await screen.findByRole("dialog");
    await userEvent.setup().click(
      within(dialog).getByRole("button", { name: "Deactivate" }),
    );

    await waitFor(() =>
      expect(mockSetActive).toHaveBeenCalledWith("u1", false, expect.any(Function)),
    );
    expect(mockList).toHaveBeenCalledTimes(2);
    expect(await screen.findByText("Inactive")).toBeInTheDocument();
  });

  it("shows the empty state when there are no users", async () => {
    mockList.mockResolvedValue([]);

    render(<AdminUsersPage />);

    expect(await screen.findByText("No users yet.")).toBeInTheDocument();
  });
});
