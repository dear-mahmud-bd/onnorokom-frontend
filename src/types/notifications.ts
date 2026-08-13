// Realtime notification payloads pushed over SignalR from the backend
// NotificationHub (`/hubs/notifications`). The server records live in
// `backendS/backend/Hubs/SignalRNotificationService.cs` as PascalCase C#
// records, but they go out over the default `JsonHubProtocol` (the backend
// calls `AddSignalR()` with no `.AddJsonProtocol(...)` override), whose
// PropertyNamingPolicy is camelCase — so the fields arrive camelCased below.
// Consumers should still read defensively (see notificationHub helpers) so a
// server-side casing change is a no-op rather than a crash.

/** Method names the hub invokes on the client — mirror the server's SendAsync. */
export const NOTIFICATION_METHODS = {
  AssignmentPublished: "AssignmentPublished",
  GradePosted: "GradePosted",
} as const;

export type NotificationMethod =
  (typeof NOTIFICATION_METHODS)[keyof typeof NOTIFICATION_METHODS];

/** Wire payload for `AssignmentPublished` (record AssignmentPublishedNotification). */
export interface AssignmentPublishedNotification {
  assignmentId: string;
  title: string;
  /** ISO-8601 string (C# DateTimeOffset serialized). */
  deadline: string;
}

/** Wire payload for `GradePosted` (record GradePostedNotification). */
export interface GradePostedNotification {
  submissionId: string;
  /** decimal? on the server — null when a status change carries no marks. */
  marks: number | null;
  feedback: string | null;
}

/** UI-facing normalized notification: a tagged union over the two methods. */
export type RealtimeNotification =
  | {
      id: string;
      type: "AssignmentPublished";
      receivedAt: string;
      payload: AssignmentPublishedNotification;
    }
  | {
      id: string;
      type: "GradePosted";
      receivedAt: string;
      payload: GradePostedNotification;
    };
