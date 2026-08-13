import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useNotifications } from "@/context/NotificationsContext";
import type { RealtimeNotification } from "@/types";

jest.mock("@/context/NotificationsContext", () => ({
  useNotifications: jest.fn(),
}));

// Defensive: render next/link as a plain anchor so no App Router context is
// required in the test environment.
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    onClick,
  }: {
    href: string;
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  ),
}));

const mockUseNotifications = useNotifications as jest.Mock;
const markAllRead = jest.fn();

function setNotifications(
  value: Partial<ReturnType<typeof useNotifications>> = {},
) {
  mockUseNotifications.mockReturnValue({
    notifications: [],
    unreadCount: 0,
    markAllRead,
    clear: jest.fn(),
    ...value,
  });
}

const assignmentItem: RealtimeNotification = {
  id: "n1",
  type: "AssignmentPublished",
  receivedAt: "2026-08-13T10:00:00Z",
  payload: { assignmentId: "a1", title: "Essay", deadline: "2026-09-01T00:00:00Z" },
};

const gradeItem: RealtimeNotification = {
  id: "n2",
  type: "GradePosted",
  receivedAt: "2026-08-13T11:00:00Z",
  payload: { submissionId: "s1", marks: 90, feedback: "Great" },
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("NotificationBell", () => {
  it("hides the unread badge when there are no unread notifications", () => {
    setNotifications({ unreadCount: 0 });
    render(<NotificationBell />);

    expect(screen.queryByText("9+")).not.toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("shows the exact unread count", () => {
    setNotifications({ unreadCount: 3 });
    render(<NotificationBell />);

    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("caps the unread badge at 9+", () => {
    setNotifications({ unreadCount: 12 });
    render(<NotificationBell />);

    expect(screen.getByText("9+")).toBeInTheDocument();
  });

  it("opens the panel and marks all read when the bell is clicked", async () => {
    const user = userEvent.setup();
    setNotifications({ notifications: [assignmentItem], unreadCount: 1 });
    render(<NotificationBell />);

    await user.click(screen.getByRole("button", { name: "Notifications" }));

    expect(markAllRead).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("shows the empty state when there are no notifications", async () => {
    const user = userEvent.setup();
    setNotifications({ notifications: [] });
    render(<NotificationBell />);

    await user.click(screen.getByRole("button", { name: "Notifications" }));

    expect(
      screen.getByText(/You're all caught up/i),
    ).toBeInTheDocument();
  });

  it("links each notification to its target screen", async () => {
    const user = userEvent.setup();
    setNotifications({ notifications: [assignmentItem, gradeItem] });
    render(<NotificationBell />);

    await user.click(screen.getByRole("button", { name: "Notifications" }));

    expect(
      screen.getByRole("link", { name: /New assignment published/i }),
    ).toHaveAttribute("href", "/student/assignments/a1");
    expect(
      screen.getByRole("link", { name: /Submission graded/i }),
    ).toHaveAttribute("href", "/student/assignments");
  });
});
