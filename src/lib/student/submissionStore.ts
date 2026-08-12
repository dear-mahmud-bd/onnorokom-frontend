// Stopgap: the backend has no "get my submission for an assignment" endpoint
// (GET /api/submissions?assignmentId= is Teacher,Admin-only). A student only
// learns their submission id from the submit response, so we persist an
// assignmentId → submissionId map in localStorage to recover it on revisit.
// Replace this with a real query once such an endpoint exists.

const STORAGE_KEY = "student.submissionIds";

function readMap(): Record<string, string> {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as unknown;
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, string>)
      : {};
  } catch {
    return {};
  }
}

export function getStoredSubmissionId(assignmentId: string): string | null {
  return readMap()[assignmentId] ?? null;
}

export function setStoredSubmissionId(
  assignmentId: string,
  submissionId: string,
): void {
  if (typeof window === "undefined") {
    return;
  }
  const map = readMap();
  map[assignmentId] = submissionId;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Ignore quota/serialization failures — this is a best-effort cache.
  }
}
