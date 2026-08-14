import type { ApiErrorBody } from "@/types";
import { attemptTokenRefresh } from "./refresh";

export type TokenProvider = () => string | null;

interface FetchOptions extends Omit<RequestInit, "body"> {
  body?: BodyInit | null;
}

export class ApiError extends Error {
  readonly status: number;
  readonly problem: ApiErrorBody;
  readonly network: boolean;

  constructor(status: number, problem: ApiErrorBody, network = false) {
    super(problem.title ?? problem.detail ?? `Request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.problem = problem;
    this.network = network;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

const JSON_CONTENT_TYPE = "application/json";

function buildHeaders(
  init: FetchOptions,
  tokenProvider: TokenProvider,
): Headers {
  const headers = new Headers(init.headers);
  const acceptsFormData = init.body instanceof FormData;

  if (!acceptsFormData && !headers.has("content-type")) {
    headers.set("content-type", JSON_CONTENT_TYPE);
  }

  const token = tokenProvider();
  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  }

  return headers;
}

async function parseErrorBody(
  response: Response,
): Promise<ApiErrorBody> {
  const text = await response.text();

  if (!text) {
    return {
      status: response.status,
      title: response.statusText,
    };
  }

  try {
    const parsed = JSON.parse(text) as ApiErrorBody;
    if (typeof parsed === "object" && parsed !== null) {
      return parsed;
    }
  } catch {
    // Not JSON — fall through to synthesized body.
  }

  return {
    status: response.status,
    title: response.statusText,
    detail: text,
  };
}

async function parseSuccessBody<TResponse>(response: Response): Promise<TResponse> {
  const text = await response.text();

  if (!text) {
    return undefined as TResponse;
  }

  return JSON.parse(text) as TResponse;
}

// The auth endpoints must not trigger a token refresh: a 401 from login means
// bad credentials, and refresh is what does the renewing in the first place.
function isAuthEndpoint(path: string): boolean {
  return (
    path.startsWith("/api/auth/login") || path.startsWith("/api/auth/refresh")
  );
}

async function request<TResponse>(
  path: string,
  init: FetchOptions,
  tokenProvider: TokenProvider,
  allowRefresh = true,
): Promise<TResponse> {
  const headers = buildHeaders(init, tokenProvider);

  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers,
      credentials: "same-origin",
    });
  } catch {
    throw new ApiError(
      0,
      {
        status: 0,
        title: "Network request failed",
        errorCode: "NetworkError",
      },
      true,
    );
  }

  // Access token likely expired: renew it once with the refresh token and retry.
  // If the refresh token is also expired, attemptTokenRefresh clears the session
  // (logging the user out) and returns false, so the 401 falls through below.
  if (
    response.status === 401 &&
    allowRefresh &&
    !isAuthEndpoint(path) &&
    (await attemptTokenRefresh())
  ) {
    return request<TResponse>(path, init, tokenProvider, false);
  }

  if (!response.ok) {
    throw new ApiError(response.status, await parseErrorBody(response));
  }

  return parseSuccessBody<TResponse>(response);
}

export function apiFetch<TResponse>(
  path: string,
  init: FetchOptions = {},
  tokenProvider: TokenProvider = () => null,
): Promise<TResponse> {
  return request<TResponse>(path, init, tokenProvider);
}