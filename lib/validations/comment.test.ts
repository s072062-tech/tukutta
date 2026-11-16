// createCommentSchema の入力検証ユニットテスト
import { COMMENT_BODY_MAX } from "@/lib/constants";
import { createCommentSchema } from "@/lib/validations/comment";
import { describe, expect, it } from "vitest";

describe("createCommentSchema", () => {
  it("本文だけの入力を受け付ける", () => {
    expect(createCommentSchema.parse({ body: "フィードバック" })).toEqual({
      body: "フィードバック",
    });
  });

  it("parentCommentId 付きを受け付ける", () => {
    expect(
      createCommentSchema.parse({ body: "返信です", parentCommentId: 3 }),
    ).toEqual({ body: "返信です", parentCommentId: 3 });
  });

  it("空白の本文は「本文を入力してください。」で失敗する", () => {
    const result = createCommentSchema.safeParse({ body: "   " });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("本文を入力してください。");
    }
  });

  it("長すぎる本文は失敗する", () => {
    const result = createCommentSchema.safeParse({
      body: "あ".repeat(COMMENT_BODY_MAX + 1),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        `本文は${COMMENT_BODY_MAX}文字以内で入力してください。`,
      );
    }
  });
});
