// Transport layer for live notifications. Pure module — no React, no UI.
// Builds a SignalR HubConnection to the backend NotificationHub and exposes
// small typed helpers to register handlers for the two server-pushed methods.
// The provider/bell UI that consumes this lands in FE-135.
import {
  HubConnection,
  HubConnectionBuilder,
  LogLevel,
} from "@microsoft/signalr";
import { sessionTokenProvider } from "@/lib/api/token";
import {
  NOTIFICATION_METHODS,
  type AssignmentPublishedNotification,
  type GradePostedNotification,
} from "@/types/notifications";

// Same-origin path; `next.config.ts` rewrites `/hubs/*` to the API origin so
// the negotiate handshake and fallback transports stay same-origin. The JWT
// rides in the `access_token` query string (browsers can't set an auth header
// on a WebSocket); the server maps it via OnMessageReceived on `/hubs/*`.
const HUB_URL = "/hubs/notifications";

/**
 * Build (but do not start) a HubConnection to the notification hub. Auth reuses
 * the current session token; automatic reconnect is enabled. `skipNegotiation`
 * is intentionally NOT set so SignalR can fall back (SSE/long-polling) when the
 * WebSocket upgrade doesn't survive the Next rewrite.
 */
export function createNotificationConnection(): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(HUB_URL, {
      accessTokenFactory: () => sessionTokenProvider() ?? "",
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build();
}

// The wire is camelCase (default JsonHubProtocol), but we read both casings so a
// server-side naming change degrades to a no-op instead of undefined fields.
function pick<T>(obj: unknown, camel: string, pascal: string): T | undefined {
  if (obj === null || typeof obj !== "object") return undefined;
  const record = obj as Record<string, unknown>;
  return (record[camel] ?? record[pascal]) as T | undefined;
}

function normalizeAssignmentPublished(
  raw: unknown,
): AssignmentPublishedNotification {
  return {
    assignmentId: pick<string>(raw, "assignmentId", "AssignmentId") ?? "",
    title: pick<string>(raw, "title", "Title") ?? "",
    deadline: pick<string>(raw, "deadline", "Deadline") ?? "",
  };
}

function normalizeGradePosted(raw: unknown): GradePostedNotification {
  return {
    submissionId: pick<string>(raw, "submissionId", "SubmissionId") ?? "",
    marks: pick<number>(raw, "marks", "Marks") ?? null,
    feedback: pick<string>(raw, "feedback", "Feedback") ?? null,
  };
}

/** Register a handler for the hub's `AssignmentPublished` push. */
export function onAssignmentPublished(
  connection: HubConnection,
  handler: (payload: AssignmentPublishedNotification) => void,
): void {
  connection.on(NOTIFICATION_METHODS.AssignmentPublished, (raw: unknown) => {
    handler(normalizeAssignmentPublished(raw));
  });
}

/** Register a handler for the hub's `GradePosted` push. */
export function onGradePosted(
  connection: HubConnection,
  handler: (payload: GradePostedNotification) => void,
): void {
  connection.on(NOTIFICATION_METHODS.GradePosted, (raw: unknown) => {
    handler(normalizeGradePosted(raw));
  });
}

/** Start the connection, swallowing/logging failures (e.g. no session yet). */
export async function startNotificationConnection(
  connection: HubConnection,
): Promise<void> {
  try {
    await connection.start();
  } catch (error) {
    console.warn("SignalR notification connection failed to start", error);
  }
}

/** Stop the connection, swallowing/logging failures. */
export async function stopNotificationConnection(
  connection: HubConnection,
): Promise<void> {
  try {
    await connection.stop();
  } catch (error) {
    console.warn("SignalR notification connection failed to stop", error);
  }
}
