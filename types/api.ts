// APIの型定義

// エラーコード
export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "PROFILE_REQUIRED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "INTERNAL_ERROR";

// エラーレスポンス
export type ApiErrorBody = {
  error: {
    code: ApiErrorCode;
    message: string;
    fieldErrors?: Record<string, string[]>;
  };
};

// カーソルページングの共通レスポンス
export type Paginated<T> = { items: T[]; nextCursor: number | null };
