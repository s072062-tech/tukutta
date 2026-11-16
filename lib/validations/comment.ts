// コメント本文の zod 検証
import { COMMENT_BODY_MAX } from "@/lib/constants";
import { bodyTextSchema } from "@/lib/validations/common";
import { z } from "zod";

export const createCommentSchema = z.object({
  body: bodyTextSchema(COMMENT_BODY_MAX),
  parentCommentId: z.number().int().positive().optional(),
});

export type CreateCommentRequest = z.infer<typeof createCommentSchema>;
