// タスク登録・更新用の zod 検証定義
import { TASK_NAME_MAX, TASK_STATUSES } from "@/lib/constants";
import { z } from "zod";

const taskNameSchema = z
  .string()
  .trim()
  .min(1, "タスク名を入力してください。")
  .max(TASK_NAME_MAX, `タスク名は${TASK_NAME_MAX}文字以内で入力してください。`);

export const createTaskSchema = z.object({
  name: taskNameSchema,
  status: z.enum(TASK_STATUSES, { error: "ステータスを選んでください。" }),
});

export type CreateTaskInput = z.input<typeof createTaskSchema>;
export type CreateTaskValues = z.output<typeof createTaskSchema>;
