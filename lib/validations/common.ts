// パスパラメータとクエリ、本文の共通zodスキーマ
import { USER_HANDLE_PATTERN } from "@/lib/constants";
import { z } from "zod";

// postId / projectId / taskId / commentId 用。失敗時は呼び出し側で notFound にする
export const idParamSchema = z.coerce.number().int().positive();

// User.userId（ハンドル）用
export const userIdParamSchema = z
  .string()
  .trim()
  .regex(USER_HANDLE_PATTERN, "対象が見つかりません。");

// 一覧のカーソル（省略可の正の整数）
export const cursorQuerySchema = z.coerce.number().int().positive();

// 投稿・コメント本文の共通ルール
export function bodyTextSchema(max: number) {
  return z
    .string()
    .trim()
    .min(1, "本文を入力してください。")
    .max(max, `本文は${max}文字以内で入力してください。`);
}
