import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminEnrollmentsPage from "@/app/(app)/admin/enrollments/page";
import {
  createEnrollment,
  deleteEnrollment,
  listEnrollments,
} from "@/lib/api/enrollments";
import { listUsers } from "@/lib/api/users";
import { listClasses } from "@/lib/api/classes";
import { UserRole } from "@/types";

jest.mock("@/lib/api/enrollments", () => ({
  listEnrollments: jest.fn(),
  createEnrollment: jest.fn(),
  deleteEnrollment: jest.fn(),
}));
jest.mock("@/lib/api/users", () => ({ listUsers: jest.fn() }));
jest.mock("@/lib/api/classes", () => ({ listClasses: jest.fn() }));
jest.mock("@/lib/api/token", () => ({
  sessionTokenProvider: jest.fn(() => "test-token"),
}));

const mockListEnrollments = listEnrollments as jest.Mock;
const mockCreate = createEnrollment as jest.Mock;
const mockDelete = deleteEnrollment as jest.Mock;
const mockListUsers = listUsers as jest.Mock;
const mockListClasses = listClasses as jest.Mock;

const STUDENT_FREE = {
  id: "11111111-1111-1111-1111-111111111111",
  fullName: "Grace Hopper",
  email: "grace@demo.local",
  role: UserRole.Student,
  isActive: true,
  isEmailVerified: true,
  createdAt: "2026-08-01T00:00:00Z",
};
const STUDENT_ENROLLED = {
  id: "22222222-2222-2222-2222-222222222222",
  fullName: "Alan Turing",
  email: "alan@demo.local",
  role: UserRole.Student,
  isActive: true,
  isEmailVerified: true,
  createdAt: "2026-08-01T00:00:00Z",
};
const CLASS_A = {
  id: "33333333-3333-3333-3333-333333333333",
  name: "Class A",
  gradeLevel: "9",
  createdAt: "2026-08-01T00:00:00Z",
};

beforeEach(() => {
  jest.clearAllMocks();
  mockListUsers.mockResolvedValue([STUDENT_FREE, STUDENT_ENROLLED]);
  mockListClasses.mockResolvedValue([CLASS_A]);
  mockCreate.mockResolvedValue(undefined);
  mockDelete.mockResolvedValue(undefined);
});

async function waitForLoad() {
  await screen.findByRole("option", { name: "Class A — 9" });
}

describe("AdminEnrollmentsPage", () => {
  it("keeps Student disabled until a class is chosen", async () => {
    mockListEnrollments.mockResolvedValue([]);

    render(<AdminEnrollmentsPage />);
    await waitForLoad();

    expect(screen.getByLabelText("Student")).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Add enrollment" }),
    ).toBeDisabled();
  });

  it("offers only students not already in any class, then submits", async () => {
    // Alan Turing already belongs to a class, so he must not be offered.
    mockListEnrollments.mockResolvedValue([
      {
        id: "aaaa1111-1111-1111-1111-111111111111",
        studentId: STUDENT_ENROLLED.id,
        classId: CLASS_A.id,
        enrolledAt: "2026-08-02T00:00:00Z",
      },
    ]);

    render(<AdminEnrollmentsPage />);
    const ui = userEvent.setup();
    await waitForLoad();

    await ui.selectOptions(screen.getByLabelText("Class"), CLASS_A.id);

    const studentSelect = screen.getByLabelText("Student");
    await waitFor(() => expect(studentSelect).toBeEnabled());
    expect(
      within(studentSelect).queryByRole("option", {
        name: "Alan Turing — alan@demo.local",
      }),
    ).not.toBeInTheDocument();
    expect(
      within(studentSelect).getByRole("option", {
        name: "Grace Hopper — grace@demo.local",
      }),
    ).toBeInTheDocument();

    await ui.selectOptions(studentSelect, STUDENT_FREE.id);

    const submit = screen.getByRole("button", { name: "Add enrollment" });
    await waitFor(() => expect(submit).toBeEnabled());
    await ui.click(submit);

    await waitFor(() =>
      expect(mockCreate).toHaveBeenCalledWith(
        { classId: CLASS_A.id, studentId: STUDENT_FREE.id },
        expect.any(Function),
      ),
    );
  });

  it("shows a message when every student already belongs to a class", async () => {
    mockListUsers.mockResolvedValue([STUDENT_ENROLLED]);
    mockListEnrollments.mockResolvedValue([
      {
        id: "aaaa1111-1111-1111-1111-111111111111",
        studentId: STUDENT_ENROLLED.id,
        classId: CLASS_A.id,
        enrolledAt: "2026-08-02T00:00:00Z",
      },
    ]);

    render(<AdminEnrollmentsPage />);
    const ui = userEvent.setup();
    await waitForLoad();

    await ui.selectOptions(screen.getByLabelText("Class"), CLASS_A.id);

    expect(
      await screen.findByText(
        "No students remaining — every student already belongs to a class.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add enrollment" }),
    ).toBeDisabled();
  });
});
