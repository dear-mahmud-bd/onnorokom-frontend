import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminTeacherAssignmentsPage from "@/app/(app)/admin/teacher-assignments/page";
import {
  createTeacherAssignment,
  deleteTeacherAssignment,
  listTeacherAssignments,
} from "@/lib/api/teacherAssignments";
import { listUsers } from "@/lib/api/users";
import { listSubjects } from "@/lib/api/subjects";
import { listClasses } from "@/lib/api/classes";
import { UserRole } from "@/types";

jest.mock("@/lib/api/teacherAssignments", () => ({
  listTeacherAssignments: jest.fn(),
  createTeacherAssignment: jest.fn(),
  deleteTeacherAssignment: jest.fn(),
}));
jest.mock("@/lib/api/users", () => ({ listUsers: jest.fn() }));
jest.mock("@/lib/api/subjects", () => ({ listSubjects: jest.fn() }));
jest.mock("@/lib/api/classes", () => ({ listClasses: jest.fn() }));
jest.mock("@/lib/api/token", () => ({
  sessionTokenProvider: jest.fn(() => "test-token"),
}));

const mockListAssignments = listTeacherAssignments as jest.Mock;
const mockCreate = createTeacherAssignment as jest.Mock;
const mockDelete = deleteTeacherAssignment as jest.Mock;
const mockListUsers = listUsers as jest.Mock;
const mockListSubjects = listSubjects as jest.Mock;
const mockListClasses = listClasses as jest.Mock;

const TEACHER = {
  id: "11111111-1111-1111-1111-111111111111",
  fullName: "Ada Lovelace",
  email: "ada@demo.local",
  role: UserRole.Teacher,
  isActive: true,
  isEmailVerified: true,
  createdAt: "2026-08-01T00:00:00Z",
};
const SUBJECT = {
  id: "22222222-2222-2222-2222-222222222222",
  name: "Math",
  code: "MATH",
  createdAt: "2026-08-01T00:00:00Z",
};
const CLASS_A = {
  id: "33333333-3333-3333-3333-333333333333",
  name: "Class A",
  gradeLevel: "9",
  createdAt: "2026-08-01T00:00:00Z",
};
const CLASS_B = {
  id: "44444444-4444-4444-4444-444444444444",
  name: "Class B",
  gradeLevel: "9",
  createdAt: "2026-08-01T00:00:00Z",
};

beforeEach(() => {
  jest.clearAllMocks();
  mockListUsers.mockResolvedValue([TEACHER]);
  mockListSubjects.mockResolvedValue([SUBJECT]);
  mockListClasses.mockResolvedValue([CLASS_A, CLASS_B]);
  mockCreate.mockResolvedValue(undefined);
  mockDelete.mockResolvedValue(undefined);
});

async function waitForLoad() {
  await screen.findByRole("option", {
    name: "Ada Lovelace — ada@demo.local",
  });
}

describe("AdminTeacherAssignmentsPage", () => {
  it("lists teachers as 'name — email' rather than a GUID", async () => {
    mockListAssignments.mockResolvedValue([]);

    render(<AdminTeacherAssignmentsPage />);

    expect(
      await screen.findByRole("option", {
        name: "Ada Lovelace — ada@demo.local",
      }),
    ).toBeInTheDocument();
    expect(mockListUsers).toHaveBeenCalledWith(
      expect.any(Function),
      UserRole.Teacher,
    );
  });

  it("keeps Class and Subject disabled until their prerequisite is chosen", async () => {
    mockListAssignments.mockResolvedValue([]);

    render(<AdminTeacherAssignmentsPage />);
    await waitForLoad();

    expect(screen.getByLabelText("Class")).toBeDisabled();
    expect(screen.getByLabelText("Subject")).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Add assignment" }),
    ).toBeDisabled();
  });

  it("cascades teacher → class → subject, hiding saturated classes, then submits", async () => {
    // CLASS_A is already fully saturated for this teacher (only one subject
    // exists and it's taken there), so CLASS_A must not be offered.
    mockListAssignments.mockResolvedValue([
      {
        id: "aaaa1111-1111-1111-1111-111111111111",
        teacherId: TEACHER.id,
        subjectId: SUBJECT.id,
        classId: CLASS_A.id,
        createdAt: "2026-08-02T00:00:00Z",
      },
    ]);

    render(<AdminTeacherAssignmentsPage />);
    const ui = userEvent.setup();
    await waitForLoad();

    await ui.selectOptions(screen.getByLabelText("Teacher"), TEACHER.id);

    const classSelect = screen.getByLabelText("Class");
    await waitFor(() => expect(classSelect).toBeEnabled());
    expect(
      within(classSelect).queryByRole("option", { name: "Class A — 9" }),
    ).not.toBeInTheDocument();
    expect(
      within(classSelect).getByRole("option", { name: "Class B — 9" }),
    ).toBeInTheDocument();

    await ui.selectOptions(classSelect, CLASS_B.id);

    const subjectSelect = screen.getByLabelText("Subject");
    await waitFor(() => expect(subjectSelect).toBeEnabled());
    await ui.selectOptions(subjectSelect, SUBJECT.id);

    const submit = screen.getByRole("button", { name: "Add assignment" });
    await waitFor(() => expect(submit).toBeEnabled());
    await ui.click(submit);

    await waitFor(() =>
      expect(mockCreate).toHaveBeenCalledWith(
        {
          teacherId: TEACHER.id,
          classId: CLASS_B.id,
          subjectId: SUBJECT.id,
        },
        expect.any(Function),
      ),
    );
  });

  it("shows a message when the teacher is saturated across every class", async () => {
    mockListClasses.mockResolvedValue([CLASS_A]);
    mockListAssignments.mockResolvedValue([
      {
        id: "aaaa1111-1111-1111-1111-111111111111",
        teacherId: TEACHER.id,
        subjectId: SUBJECT.id,
        classId: CLASS_A.id,
        createdAt: "2026-08-02T00:00:00Z",
      },
    ]);

    render(<AdminTeacherAssignmentsPage />);
    const ui = userEvent.setup();
    await waitForLoad();

    await ui.selectOptions(screen.getByLabelText("Teacher"), TEACHER.id);

    expect(
      await screen.findByText(
        "This teacher is already assigned to every subject in every class.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add assignment" }),
    ).toBeDisabled();
  });
});
