import type { HubConnection } from "@microsoft/signalr";
import {
  onAssignmentPublished,
  onGradePosted,
} from "@/lib/realtime/notificationHub";
import { NOTIFICATION_METHODS } from "@/types/notifications";

// A minimal stand-in for a HubConnection that captures the handler registered
// via `.on(method, cb)`, so tests can fire a raw payload at it and observe what
// the module's (private) normalizer produced — without opening a real socket or
// exporting the internals.
function stubConnection() {
  const handlers = new Map<string, (raw: unknown) => void>();
  const connection = {
    on: (method: string, cb: (raw: unknown) => void) => {
      handlers.set(method, cb);
    },
  } as unknown as HubConnection;
  const emit = (method: string, raw: unknown) => handlers.get(method)?.(raw);
  return { connection, emit };
}

describe("onAssignmentPublished normalization", () => {
  it("normalizes a camelCase payload", () => {
    const { connection, emit } = stubConnection();
    const received = jest.fn();
    onAssignmentPublished(connection, received);

    emit(NOTIFICATION_METHODS.AssignmentPublished, {
      assignmentId: "a1",
      title: "Essay",
      deadline: "2026-09-01T00:00:00Z",
    });

    expect(received).toHaveBeenCalledWith({
      assignmentId: "a1",
      title: "Essay",
      deadline: "2026-09-01T00:00:00Z",
    });
  });

  it("normalizes an equivalent PascalCase payload identically", () => {
    const { connection, emit } = stubConnection();
    const received = jest.fn();
    onAssignmentPublished(connection, received);

    emit(NOTIFICATION_METHODS.AssignmentPublished, {
      AssignmentId: "a1",
      Title: "Essay",
      Deadline: "2026-09-01T00:00:00Z",
    });

    expect(received).toHaveBeenCalledWith({
      assignmentId: "a1",
      title: "Essay",
      deadline: "2026-09-01T00:00:00Z",
    });
  });

  it("fills empty-string defaults for missing fields", () => {
    const { connection, emit } = stubConnection();
    const received = jest.fn();
    onAssignmentPublished(connection, received);

    emit(NOTIFICATION_METHODS.AssignmentPublished, {});

    expect(received).toHaveBeenCalledWith({
      assignmentId: "",
      title: "",
      deadline: "",
    });
  });
});

describe("onGradePosted normalization", () => {
  it("normalizes a camelCase payload", () => {
    const { connection, emit } = stubConnection();
    const received = jest.fn();
    onGradePosted(connection, received);

    emit(NOTIFICATION_METHODS.GradePosted, {
      submissionId: "s1",
      marks: 87,
      feedback: "Nice work",
    });

    expect(received).toHaveBeenCalledWith({
      submissionId: "s1",
      marks: 87,
      feedback: "Nice work",
    });
  });

  it("normalizes an equivalent PascalCase payload identically", () => {
    const { connection, emit } = stubConnection();
    const received = jest.fn();
    onGradePosted(connection, received);

    emit(NOTIFICATION_METHODS.GradePosted, {
      SubmissionId: "s1",
      Marks: 87,
      Feedback: "Nice work",
    });

    expect(received).toHaveBeenCalledWith({
      submissionId: "s1",
      marks: 87,
      feedback: "Nice work",
    });
  });

  it("preserves a zero mark rather than defaulting it to null", () => {
    const { connection, emit } = stubConnection();
    const received = jest.fn();
    onGradePosted(connection, received);

    emit(NOTIFICATION_METHODS.GradePosted, { submissionId: "s1", marks: 0 });

    expect(received).toHaveBeenCalledWith({
      submissionId: "s1",
      marks: 0,
      feedback: null,
    });
  });

  it("defaults submissionId to empty and marks/feedback to null when missing", () => {
    const { connection, emit } = stubConnection();
    const received = jest.fn();
    onGradePosted(connection, received);

    emit(NOTIFICATION_METHODS.GradePosted, {});

    expect(received).toHaveBeenCalledWith({
      submissionId: "",
      marks: null,
      feedback: null,
    });
  });
});
