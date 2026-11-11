// プロジェクト登録・編集フォームのzod検証定義
import { PROJECT_DESCRIPTION_MAX, PROJECT_NAME_MAX } from "@/lib/constants";
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
