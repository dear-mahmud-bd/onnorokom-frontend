import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StudentAssignmentsPage from "@/app/(app)/student/assignments/page";
import { listMyAssignments, searchAssignments } from "@/lib/api/assignments";
import { AssignmentStatus } from "@/types";
import type { AssignmentResponse, SearchAssignmentsResult } from "@/types";

jest.mock("@/lib/api/assignments", () => ({
  listMyAssignments: jest.fn(),
  searchAssignments: jest.fn(),
}));
jest.mock("@/lib/api/token", () => ({
  sessionTokenProvider: jest.fn(() => "test-token"),
}));
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const mockList = listMyAssignments as jest.Mock;
const mockSearch = searchAssignments as jest.Mock;

function assignment(overrides: Partial<AssignmentResponse> = {}): AssignmentResponse {
  return {
    id: "a1",
    title: "Algebra Problem Set 1",
    description: "desc",
    subjectId: "s1",
    classId: "c1",
    teacherId: "t1",
    deadline: "2026-09-01T00:00:00Z",
    maxMarks: 100,
    status: AssignmentStatus.Published,
    allowResubmissionUntilDeadline: true,
    createdAt: "2026-08-01T00:00:00Z",
    updatedAt: "2026-08-01T00:00:00Z",
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("StudentAssignmentsPage", () => {
  it("renders the class-scoped browse list on mount", async () => {
    mockList.mockResolvedValue([assignment({ title: "Algebra Problem Set 1" })]);

    render(<StudentAssignmentsPage />);

    expect(
      await screen.findByRole("link", { name: "Algebra Problem Set 1" }),
    ).toBeInTheDocument();
    expect(mockList).toHaveBeenCalledTimes(1);
  });

  it("shows the empty state when the student has no class assignments", async () => {
    mockList.mockResolvedValue([]);

    render(<StudentAssignmentsPage />);

    expect(
      await screen.findByText(/don't have any published assignments/i),
    ).toBeInTheDocument();
  });

  it("switches to search results when a term is submitted", async () => {
    const user = userEvent.setup();
    mockList.mockResolvedValue([]);
    const result: SearchAssignmentsResult = {
      hits: [
        {
          id: "h1",
          title: "Searched Assignment",
          description: "d",
          subjectName: "Math",
          className: "Grade 10 - A",
          teacherName: "Ms Demo",
          status: AssignmentStatus.Published,
          deadline: "2026-09-01T00:00:00Z",
        },
      ],
      totalMatches: 1,
      take: 10,
      skip: 0,
    };
    mockSearch.mockResolvedValue(result);

    render(<StudentAssignmentsPage />);
    await screen.findByText(/don't have any published assignments/i);

    await user.type(screen.getByLabelText("Search"), "searched");
    await user.click(screen.getByRole("button", { name: "Search" }));

    expect(
      await screen.findByRole("link", { name: "Searched Assignment" }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(mockSearch).toHaveBeenCalledWith(
        expect.objectContaining({ searchText: "searched", skip: 0, take: 10 }),
        expect.any(Function),
      ),
    );
  });

  it("hints instead of round-tripping on an empty search term", async () => {
    const user = userEvent.setup();
    mockList.mockResolvedValue([]);

    render(<StudentAssignmentsPage />);
    await screen.findByText(/don't have any published assignments/i);

    await user.click(screen.getByRole("button", { name: "Search" }));

    expect(
      await screen.findByText(/enter a search term/i),
    ).toBeInTheDocument();
    expect(mockSearch).not.toHaveBeenCalled();
  });
});
