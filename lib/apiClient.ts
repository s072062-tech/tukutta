// クライアントのAPI共通処理
import type { ApiErrorBody, ApiErrorCode } from "@/types/api";

const API_ERROR_CODES: ApiErrorCode[] = [
  "UNAUTHORIZED",
  "PROFILE_REQUIRED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "VALIDATION_ERROR",
  "INTERNAL_ERROR",
];

// クライアントAPIエラー情報
export class ApiClientError extends Error {
  status: number;
  code: ApiErrorCode;
  fieldErrors?: Record<string, string[]>;

  constructor(
    status: number,
    code: ApiErrorCode,
    message: string,
    fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

// サーバーから返ってきたcodeがAPI_ERROR_CODESに定義されているか確認
function isApiErrorCode(value: string): value is ApiErrorCode {
  return API_ERROR_CODES.some((code) => code === value);
}

// fetchを実行、レスポンスを処理する
async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    let body: ApiErrorBody | null = null;
    try {
      body = (await response.json()) as ApiErrorBody;
    } catch {
      body = null;
    }
    const code = body?.error.code;
    throw new ApiClientError(
      response.status,
      code && isApiErrorCode(code) ? code : "INTERNAL_ERROR",
      body?.error.message ?? "エラーが発生しました。時間をおいて再度お試しください。",
      body?.error.fieldErrors,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}

// GETをrequestで実行
export function apiGet<T>(url: string) {
  return request<T>(url);
}

// POSTをrequestで実行、bodyはJSONにする
export function apiPost<T>(url: string, body?: unknown) {
  return request<T>(url, {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

// PATCHをrequestで実行、bodyはJSONにする
export function apiPatch<T>(url: string, body: unknown) {
  return request<T>(url, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

// DELETEをrequestで実行
export function apiDelete<T>(url: string) {
  return request<T>(url, { method: "DELETE" });
}
