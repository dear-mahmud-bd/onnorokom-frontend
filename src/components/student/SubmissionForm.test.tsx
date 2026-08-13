import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SubmissionForm } from "@/components/student/SubmissionForm";
import { submitAssignment, updateSubmission } from "@/lib/api/submissions";
import { ApiError } from "@/lib/api/client";
import { MAX_SUBMISSION_BYTES } from "@/lib/validation";
import type { SubmissionResponse } from "@/types";

// Mock the network + side-effect boundaries; keep the real ApiError class (its
// identity matters for isApiError) and the real zod validation schema.
jest.mock("@/lib/api/submissions", () => ({
  submitAssignment: jest.fn(),
  updateSubmission: jest.fn(),
}));
jest.mock("@/lib/api/token", () => ({
  sessionTokenProvider: jest.fn(() => "test-token"),
}));
jest.mock("@/lib/student/submissionStore", () => ({
  setStoredSubmissionId: jest.fn(),
}));

const mockSubmit = submitAssignment as jest.Mock;
const mockUpdate = updateSubmission as jest.Mock;

const fakeResponse = { id: "sub-1" } as SubmissionResponse;

function makeFile(name: string, type: string, size = 1_024): File {
  const file = new File(["x"], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

function fileInput(): HTMLInputElement {
  return screen.getByLabelText("Your file") as HTMLInputElement;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("SubmissionForm", () => {
  it("rejects a disallowed file type client-side and does not submit", async () => {
    const user = userEvent.setup();
    render(
      <SubmissionForm mode="submit" assignmentId="a1" onSuccess={jest.fn()} />,
    );

    // Allowed extension but disallowed MIME type: it clears the input's
    // extension-based `accept` filter, so onChange fires and the component's own
    // zod guard is what rejects it — the client-side check `accept` can't do.
    await user.upload(fileInput(), makeFile("report.pdf", "image/png"));

    expect(
      await screen.findByText("That file type is not accepted"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Submit" }));
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it("rejects an oversized file client-side and does not submit", async () => {
    const user = userEvent.setup();
    render(
      <SubmissionForm mode="submit" assignmentId="a1" onSuccess={jest.fn()} />,
    );

    await user.upload(
      fileInput(),
      makeFile("report.pdf", "application/pdf", MAX_SUBMISSION_BYTES + 1),
    );

    expect(
      await screen.findByText(/MB or smaller/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Submit" }));
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it("submits a valid file and reports success", async () => {
    const user = userEvent.setup();
    const onSuccess = jest.fn();
    mockSubmit.mockResolvedValue(fakeResponse);

    render(
      <SubmissionForm mode="submit" assignmentId="a1" onSuccess={onSuccess} />,
    );

    const file = makeFile("report.pdf", "application/pdf");
    await user.upload(fileInput(), file);
    await user.click(screen.getByRole("button", { name: "Submit" }));

    expect(mockSubmit).toHaveBeenCalledWith("a1", file, expect.any(Function));
    expect(onSuccess).toHaveBeenCalledWith(fakeResponse);
  });

  it("surfaces the closed-assignment guard copy from a server error", async () => {
    const user = userEvent.setup();
    mockSubmit.mockRejectedValue(
      new ApiError(409, { status: 409, title: "Closed", errorCode: "Closed" }),
    );

    render(
      <SubmissionForm mode="submit" assignmentId="a1" onSuccess={jest.fn()} />,
    );

    await user.upload(fileInput(), makeFile("report.pdf", "application/pdf"));
    await user.click(screen.getByRole("button", { name: "Submit" }));

    expect(
      await screen.findByText(
        "This assignment is closed and no longer accepts submissions.",
      ),
    ).toBeInTheDocument();
  });

  it("surfaces the resubmission-not-allowed guard copy from a server error", async () => {
    const user = userEvent.setup();
    mockUpdate.mockRejectedValue(
      new ApiError(409, {
        status: 409,
        title: "ResubmissionNotAllowed",
        errorCode: "ResubmissionNotAllowed",
      }),
    );

    render(
      <SubmissionForm
        mode="resubmit"
        assignmentId="a1"
        submissionId="s1"
        onSuccess={jest.fn()}
      />,
    );

    await user.upload(
      screen.getByLabelText("Replacement file"),
      makeFile("report.pdf", "application/pdf"),
    );
    await user.click(screen.getByRole("button", { name: "Resubmit" }));

    expect(
      await screen.findByText("Resubmission isn't allowed for this assignment."),
    ).toBeInTheDocument();
    expect(mockUpdate).toHaveBeenCalledWith("s1", expect.any(File), expect.any(Function));
  });
});
