// Minimal authenticated GraphQL client.
//
// A teacher cannot list classes/subjects through REST — `/api/classes` and
// `/api/subjects` are [Authorize(Roles = "Admin")]. The GraphQL `classes` and
// `subjects` queries are [Authorize(Roles = "Teacher,Admin")], so this is the
// only teacher-reachable path to that reference data.
//
// HotChocolate returns HTTP 200 with a { data, errors } envelope, so we reuse
// `apiFetch` (Bearer header + JSON handling) and surface GraphQL `errors` as an
// ApiError.

import {
  AssignmentStatus,
  type AssignmentResponse,
  type ClassResponse,
  type SubjectResponse,
} from "@/types";
import { ApiError, apiFetch, type TokenProvider } from "./client";

interface GraphQLError {
  message: string;
  extensions?: { code?: string };
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: GraphQLError[];
}

export async function graphqlRequest<T>(
  query: string,
  variables: Record<string, unknown> = {},
  tokenProvider: TokenProvider = () => null,
): Promise<T> {
  const envelope = await apiFetch<GraphQLResponse<T>>(
    "/graphql",
    {
      method: "POST",
      body: JSON.stringify({ query, variables }),
    },
    tokenProvider,
  );

  if (envelope.errors && envelope.errors.length > 0) {
    const first = envelope.errors[0];
    throw new ApiError(200, {
      status: 200,
      title: first.message,
      detail: envelope.errors.map((e) => e.message).join("; "),
      errorCode: first.extensions?.code ?? "GraphQLError",
    });
  }

  if (envelope.data === undefined) {
    throw new ApiError(200, {
      status: 200,
      title: "GraphQL response contained no data",
      errorCode: "GraphQLError",
    });
  }

  return envelope.data;
}

const CLASSES_QUERY = `
  query TeacherClasses {
    classes {
      id
      name
      gradeLevel
      createdAt
    }
  }
`;

const SUBJECTS_QUERY = `
  query TeacherSubjects {
    subjects {
      id
      name
      code
      createdAt
    }
  }
`;

export async function teacherClasses(
  tokenProvider: TokenProvider = () => null,
): Promise<ClassResponse[]> {
  const data = await graphqlRequest<{ classes: ClassResponse[] }>(
    CLASSES_QUERY,
    {},
    tokenProvider,
  );
  return data.classes;
}

export async function teacherSubjects(
  tokenProvider: TokenProvider = () => null,
): Promise<SubjectResponse[]> {
  const data = await graphqlRequest<{ subjects: SubjectResponse[] }>(
    SUBJECTS_QUERY,
    {},
    tokenProvider,
  );
  return data.subjects;
}

// Full assignment detail for the student flow. REST GET /api/assignments/{id}
// is [Authorize(Roles = "Teacher,Admin")]; the GraphQL `assignment` query is
// [Authorize] (any role), so this is the student's path to maxMarks etc.
const ASSIGNMENT_QUERY = `
  query StudentAssignment($id: UUID!) {
    assignment(id: $id) {
      id
      title
      description
      subjectId
      classId
      teacherId
      deadline
      maxMarks
      status
      allowResubmissionUntilDeadline
      createdAt
      updatedAt
    }
  }
`;

// GraphQL serializes enums as CONSTANT_CASE names (DRAFT/PUBLISHED/CLOSED),
// unlike the REST DTOs which use integers. Normalize back to the numeric
// AssignmentStatus so callers see the same shape as the REST AssignmentResponse.
// Tolerates a number too, in case the wire format ever changes.
function graphqlStatusToNumeric(value: string | number): AssignmentStatus {
  if (typeof value === "number") {
    return value as AssignmentStatus;
  }
  switch (value.toUpperCase()) {
    case "PUBLISHED":
      return AssignmentStatus.Published;
    case "CLOSED":
      return AssignmentStatus.Closed;
    default:
      return AssignmentStatus.Draft;
  }
}

type RawAssignment = Omit<AssignmentResponse, "status"> & {
  status: string | number;
};

export async function studentAssignment(
  id: string,
  tokenProvider: TokenProvider = () => null,
): Promise<AssignmentResponse> {
  const data = await graphqlRequest<{ assignment: RawAssignment | null }>(
    ASSIGNMENT_QUERY,
    { id },
    tokenProvider,
  );

  if (!data.assignment) {
    throw new ApiError(404, {
      status: 404,
      title: "Assignment not found",
      errorCode: "NotFound",
    });
  }

  return {
    ...data.assignment,
    status: graphqlStatusToNumeric(data.assignment.status),
  };
}
