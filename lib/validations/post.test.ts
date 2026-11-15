// postListQuerySchema / createPostSchema の入力検証ユニットテスト
import { POST_BODY_MAX } from "@/lib/constants";
import { createPostSchema, postListQuerySchema } from "@/lib/validations/post";
import { describe, expect, it } from "vitest";

describe("postListQuerySchema", () => {
  it("省略時の tab は latest になる", () => {
    expect(postListQuerySchema.parse({}).tab).toBe("latest");
  });

  it("不正な tab は失敗する", () => {
    expect(postListQuerySchema.safeParse({ tab: "nope" }).success).toBe(false);
  });

  it("空白だけの q は undefined になる", () => {
    expect(postListQuerySchema.parse({ q: "  " }).q).toBeUndefined();
  });

  it("q と cursor を受け付ける", () => {
    expect(
      postListQuerySchema.parse({ tab: "progress", q: " map ", cursor: "12" }),
    ).toEqual({ tab: "progress", q: "map", cursor: 12 });
  });
});

describe("createPostSchema", () => {
  it("通常投稿で空白だけの本文は失敗する", () => {
    const result = createPostSchema.safeParse({ kind: "normal", body: "  " });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("本文を入力してください。");
    }
  });

  it("通常投稿に付いた taskId は結果に残らない", () => {
    expect(
      createPostSchema.parse({ kind: "normal", body: "a", taskId: 1 }),
    ).toEqual({ kind: "normal", body: "a" });
  });

  it("進捗で必須項目が無いと失敗する", () => {
    expect(
      createPostSchema.safeParse({ kind: "progress", body: "a" }).success,
    ).toBe(false);
  });

  it("進捗の完全な入力を受け付ける", () => {
    expect(
      createPostSchema.parse({
        kind: "progress",
        body: "一歩",
        projectId: 1,
        taskId: 2,
        status: "進行中",
      }),
    ).toEqual({
      kind: "progress",
      body: "一歩",
      projectId: 1,
      taskId: 2,
      status: "進行中",
    });
  });

  it("本文が上限超過ならエラー", () => {
    const result = createPostSchema.safeParse({
      kind: "normal",
      body: "あ".repeat(POST_BODY_MAX + 1),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        `本文は${POST_BODY_MAX}文字以内で入力してください。`,
      );
    }
  });
});
