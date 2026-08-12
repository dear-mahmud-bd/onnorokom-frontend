import type { ApiErrorBody } from "@/types";

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

async function request<TResponse>(
  path: string,
  init: FetchOptions,
  tokenProvider: TokenProvider,
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