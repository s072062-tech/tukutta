// プロジェクト登録・編集フォームと一覧クエリのzod検証定義
import { PROJECT_DESCRIPTION_MAX, PROJECT_NAME_MAX } from "@/lib/constants";
import { cursorQuerySchema } from "@/lib/validations/common";
import { z } from "zod";

export const projectFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "プロジェクト名を入力してください。")
    .max(PROJECT_NAME_MAX, `プロジェクト名は${PROJECT_NAME_MAX}文字以内で入力してください。`),
  description: z
    .string()
    .trim()
    .max(
      PROJECT_DESCRIPTION_MAX,
      `概要は${PROJECT_DESCRIPTION_MAX}文字以内で入力してください。`,
    )
    .nullish()
    .transform((value) => (value ? value : null)),
});

export type ProjectFormInput = z.input<typeof projectFormSchema>;
export type ProjectFormValues = z.output<typeof projectFormSchema>;

// プロジェクト一覧 GET のクエリ（tab 不正値は all、空の q は検索なし）
export const projectListQuerySchema = z.object({
  tab: z.enum(["all", "following"]).catch("all"),
  q: z
    .string()
    .trim()
    .max(PROJECT_NAME_MAX)
    .optional()
    .transform((value) => (value ? value : undefined)),
  cursor: cursorQuerySchema.optional(),
});

export type ProjectListQuery = z.output<typeof projectListQuerySchema>;

// 歩みカレンダー用クエリ（year と month は両方省略か両方指定）
export const journeyQuerySchema = z
  .object({
    year: z.coerce.number().int().min(1).max(9999).optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
  })
  .refine((value) => (value.year === undefined) === (value.month === undefined), {
    message: "year と month は両方指定してください。",
    path: ["month"],
  });

export type JourneyQuery = z.output<typeof journeyQuerySchema>;
