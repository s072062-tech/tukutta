// 投稿一覧クエリと作成フォームの zod 検証定義
import { POST_BODY_MAX, TASK_STATUSES } from "@/lib/constants";
import { bodyTextSchema, cursorQuerySchema } from "@/lib/validations/common";
import { z } from "zod";

export const postListQuerySchema = z.object({
  tab: z.enum(["latest", "following", "progress"]).default("latest"),
  q: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
  cursor: cursorQuerySchema.optional(),
});

export type PostListQuery = z.infer<typeof postListQuerySchema>;
export type PostListTab = PostListQuery["tab"];

export const createPostSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("normal"),
    body: bodyTextSchema(POST_BODY_MAX),
  }),
  z.object({
    kind: z.literal("progress"),
    body: bodyTextSchema(POST_BODY_MAX),
    projectId: z.number().int().positive({
      error: "プロジェクトを選択してください。",
    }),
    taskId: z.number().int().positive({
      error: "タスクを選択してください。",
    }),
    status: z.enum(TASK_STATUSES, {
      error: "ステータスは未着手、進行中、完了から選択してください。",
    }),
  }),
]);

export type CreatePostInput = z.input<typeof createPostSchema>;
export type CreatePostValues = z.output<typeof createPostSchema>;
