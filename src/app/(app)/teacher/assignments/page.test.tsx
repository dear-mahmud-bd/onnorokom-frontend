import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TeacherAssignmentsPage from "@/app/(app)/teacher/assignments/page";
import { listAssignments, publishAssignment } from "@/lib/api/assignments";
import {
  teacherClasses,
  teacherSubjects,
  teacherTeachingAssignments,
} from "@/lib/api/graphql";
import { useAuth } from "@/context/AuthContext";
import { AssignmentStatus } from "@/types";

jest.mock("@/lib/api/assignments", () => ({
  listAssignments: jest.fn(),
  createAssignment: jest.fn(),
  updateAssignment: jest.fn(),
  deleteAssignment: jest.fn(),
  publishAssignment: jest.fn(),
}));
jest.mock("@/lib/api/graphql", () => ({
  teacherClasses: jest.fn(),
  teacherSubjects: jest.fn(),
  teacherTeachingAssignments: jest.fn(),
}));
jest.mock("@/lib/api/token", () => ({
  sessionTokenProvider: jest.fn(() => "test-token"),
}));
jest.mock("@/context/AuthContext", () => ({ useAuth: jest.fn() }));

const mockListAssignments = listAssignments as jest.Mock;
const mockPublish = publishAssignment as jest.Mock;
const mockClasses = teacherClasses as jest.Mock;
const mockSubjects = teacherSubjects as jest.Mock;
const mockTeaching = teacherTeachingAssignments as jest.Mock;
const mockUseAuth = useAuth as jest.Mock;

const TEACHER_ID = "22222222-2222-2222-2222-222222222222";
const SUBJECT = {
  id: "55555555-5555-5555-5555-555555555555",
  name: "Mathematics",
  code: "MATH-101",
  createdAt: "2026-08-01T00:00:00Z",
};
const CLASS = {
  id: "44444444-4444-4444-4444-444444444444",
  name: "Grade 10 - A",
  gradeLevel: "10",
  createdAt: "2026-08-01T00:00:00Z",
};

const DRAFT_ASSIGNMENT = {
  id: "88888888-8888-8888-8888-888888888888",
  title: "Chapter 3 problem set",
  description: "Do the odd-numbered questions.",
  subjectId: SUBJECT.id,
  classId: CLASS.id,
  teacherId: TEACHER_ID,
  deadline: "2026-12-31T23:59:00Z",
  maxMarks: 100,
  status: AssignmentStatus.Draft,
  allowResubmissionUntilDeadline: false,
  createdAt: "2026-08-02T00:00:00Z",
  updatedAt: "2026-08-02T00:00:00Z",
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUseAuth.mockReturnValue({ user: { id: TEACHER_ID } });
  mockClasses.mockResolvedValue([CLASS]);
  mockSubjects.mockResolvedValue([SUBJECT]);
  mockTeaching.mockResolvedValue([
    {
      id: "66666666-6666-6666-6666-666666666666",
      teacherId: TEACHER_ID,
      subjectId: SUBJECT.id,
      classId: CLASS.id,
      createdAt: "2026-08-01T00:00:00Z",
    },
  ]);
  mockListAssignments.mockResolvedValue([DRAFT_ASSIGNMENT]);
  mockPublish.mockResolvedValue({
    ...DRAFT_ASSIGNMENT,
    status: AssignmentStatus.Published,
  });
});

// Select the assigned class so the draft assignment row renders.
async function renderWithSelectedClass() {
  render(<TeacherAssignmentsPage />);
  const ui = userEvent.setup();
  const classSelect = await screen.findByLabelText("Class");
  await waitFor(() =>
    expect(
      within(classSelect).getByRole("option", { name: "Grade 10 - A — 10" }),
    ).toBeInTheDocument(),
  );
  await ui.selectOptions(classSelect, CLASS.id);
  await screen.findByText("Chapter 3 problem set");
  return ui;
}

describe("TeacherAssignmentsPage publish flow", () => {
  it("asks for confirmation before publishing instead of publishing immediately", async () => {
    const ui = await renderWithSelectedClass();

    await ui.click(screen.getByRole("button", { name: "Publish" }));

    // The confirmation dialog appears and nothing is published yet.
    expect(
      await screen.findByRole("heading", { name: "Publish assignment" }),
    ).toBeInTheDocument();
    expect(mockPublish).not.toHaveBeenCalled();
  });

  it("publishes on confirm and flips the status in place without refetching", async () => {
    const ui = await renderWithSelectedClass();
    expect(screen.getByText("Draft")).toBeInTheDocument();

    // Only the initial class-select load so far.
    expect(mockListAssignments).toHaveBeenCalledTimes(1);

    await ui.click(screen.getByRole("button", { name: "Publish" }));
    const dialog = await screen.findByRole("dialog");
    await ui.click(within(dialog).getByRole("button", { name: "Publish" }));

    await waitFor(() =>
      expect(mockPublish).toHaveBeenCalledWith(
        DRAFT_ASSIGNMENT.id,
        expect.any(Function),
      ),
    );

    // Status flips to Published with no additional list fetch.
    expect(await screen.findByText("Published")).toBeInTheDocument();
    expect(screen.queryByText("Draft")).not.toBeInTheDocument();
    expect(mockListAssignments).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByRole("button", { name: "Publish" }),
    ).not.toBeInTheDocument();
  });

  it("shows a Publishing… loading state on the confirm button while in flight", async () => {
    // Hold the publish promise open so the in-flight (busy) state is observable.
    let resolvePublish!: (value: unknown) => void;
    mockPublish.mockImplementation(
      () => new Promise((resolve) => (resolvePublish = resolve)),
    );

    const ui = await renderWithSelectedClass();
    await ui.click(screen.getByRole("button", { name: "Publish" }));
    const dialog = await screen.findByRole("dialog");
    await ui.click(within(dialog).getByRole("button", { name: "Publish" }));

    const busyButton = await within(dialog).findByRole("button", {
      name: "Publishing…",
    });
    expect(busyButton).toBeDisabled();

    resolvePublish({
      ...DRAFT_ASSIGNMENT,
      status: AssignmentStatus.Published,
    });

    expect(await screen.findByText("Published")).toBeInTheDocument();
  });

  it("leaves the assignment as a draft when the confirmation is cancelled", async () => {
    const ui = await renderWithSelectedClass();

    await ui.click(screen.getByRole("button", { name: "Publish" }));
    const dialog = await screen.findByRole("dialog");
    await ui.click(within(dialog).getByRole("button", { name: "Cancel" }));

    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Publish assignment" }),
      ).not.toBeInTheDocument(),
    );
    expect(mockPublish).not.toHaveBeenCalled();
    expect(screen.getByText("Draft")).toBeInTheDocument();
  });
});
