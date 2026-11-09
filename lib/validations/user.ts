// ユーザー登録の「ユーザー名」と「ユーザーID」のZod検証定義
import { USER_HANDLE_PATTERN, USER_NAME_MAX } from "@/lib/constants";
import { z } from "zod";

// ユーザー名の文字列ルール（必須・前後空白除去・最大文字数）
export const userNameSchema = z
  .string()
  .trim()
  .min(1, "ユーザー名を入力してください。")
  .max(USER_NAME_MAX, `ユーザー名は${USER_NAME_MAX}文字以内で入力してください。`);

// ユーザーIDの文字列ルール（必須・@禁止・半角英数字等のパターン）
export const userHandleSchema = z
  .string()
  .trim()
  .min(1, "ユーザーIDを入力してください。")
  .refine((value) => !value.includes("@"), "ユーザーIDに @ は含めずに入力してください。")
  .regex(
    USER_HANDLE_PATTERN,
    "ユーザーIDは半角英数字、アンダースコア（_）、ハイフン（-）の3〜20文字で入力してください。",
  );

// ルールをまとめたスキーマ
export const createUserSchema = z.object({
  name: userNameSchema,
  userId: userHandleSchema,
});

// z.infer で型を自動生成し、フォームやAPIの型として使う
export type CreateUserFormValues = z.infer<typeof createUserSchema>;
