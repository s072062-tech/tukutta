// APIの共通エラー表示設定
import { Prisma } from "@/app/generated/prisma/client";
import type { ApiErrorBody, ApiErrorCode } from "@/types/api";
import { ZodError } from "zod";

// エラーコードに対するデフォルトエラーメッセージ
const DEFAULT_MESSAGES: Record<ApiErrorCode, string> = {
  UNAUTHORIZED: "ログインしてください。",
  PROFILE_REQUIRED: "ユーザー名とユーザーIDを登録してください。",
  FORBIDDEN: "この操作を行う権限がありません。",
  NOT_FOUND: "対象が見つかりません。",
  CONFLICT: "すでに登録されています。",
  VALIDATION_ERROR: "入力内容を確認してください。",
  INTERNAL_ERROR: "エラーが発生しました。時間をおいて再度お試しください。",
};

// APIエラー情報
export class ApiError extends Error {
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
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

// エラーコードからApiErrorを作る、メッセージを省略するとデフォルトエラーメッセージが設定される
function createApiError(
  status: number,
  code: ApiErrorCode,
  message?: string,
  fieldErrors?: Record<string, string[]>,
) {
  return new ApiError(status, code, message ?? DEFAULT_MESSAGES[code], fieldErrors);
}

// 未ログイン401エラー
export function unauthorized() {
  return createApiError(401, "UNAUTHORIZED");
}

// プロフィール未登録403エラー
export function profileRequired() {
  return createApiError(403, "PROFILE_REQUIRED");
}

// 操作権限なし403エラー
export function forbidden() {
  return createApiError(403, "FORBIDDEN");
}

// 対象無し404エラー
export function notFound() {
  return createApiError(404, "NOT_FOUND");
}

// 重複409エラー
export function conflict(message: string, fieldErrors?: Record<string, string[]>) {
  return createApiError(409, "CONFLICT", message, fieldErrors);
}

// zodバリデーションエラーを項目ごとに422エラーにする
export function validationError(error: ZodError) {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key !== "string") {
      continue;
    }
    fieldErrors[key] ??= [];
    fieldErrors[key].push(issue.message);
  }

  return createApiError(
    422,
    "VALIDATION_ERROR",
    undefined,
    Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
  );
}

// ApiErrorを共通形式のJSONレスポンスに変換
function toResponse(error: ApiError) {
  const body: ApiErrorBody = {
    error: {
      code: error.code,
      message: error.message,
      ...(error.fieldErrors ? { fieldErrors: error.fieldErrors } : {}),
    },
  };
  return Response.json(body, { status: error.status });
}

// Prismaエラーが指定したコードか確認
function isPrismaCode(error: unknown, code: string) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}

type RouteContext<P = unknown> = { params: Promise<P> };
type RouteHandler<P = unknown> = (
  request: Request,
  context: RouteContext<P>,
) => Promise<Response>;

// handler処理の例外をJSONレスポンスに変換
export function withErrorHandling<P = unknown>(handler: RouteHandler<P>): RouteHandler {
  return async (request, context) => {
    try {
      return await handler(request, context as RouteContext<P>);
    } catch (error) {
      if (error instanceof ApiError) {
        return toResponse(error);
      }
      if (error instanceof ZodError) {
        return toResponse(validationError(error));
      }
      if (isPrismaCode(error, "P2002")) {
        return toResponse(createApiError(409, "CONFLICT"));
      }
      if (isPrismaCode(error, "P2025")) {
        return toResponse(notFound());
      }
      console.error(error);
      return toResponse(createApiError(500, "INTERNAL_ERROR"));
    }
  };
}
