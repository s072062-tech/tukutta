// フォロー一覧 API の zod 検証定義
import { cursorQuerySchema } from "@/lib/validations/common";
import { z } from "zod";

export const FOLLOW_LIST_TYPES = ["following", "followers"] as const;

export const followListQuerySchema = z.object({
  type: z
    .enum(FOLLOW_LIST_TYPES, {
      error: "type は following か followers を指定してください。",
    })
    .default("following"),
  // cursor キーが無いときはこのフィールドを入力に含めない（第1ページ）
  cursor: cursorQuerySchema.optional(),
});
