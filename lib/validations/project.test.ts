// projectFormSchema / projectListQuerySchema の入力検証ユニットテスト
import { PROJECT_DESCRIPTION_MAX, PROJECT_NAME_MAX } from "@/lib/constants";
import { projectFormSchema, projectListQuerySchema } from "@/lib/validations/project";
import { describe, expect, it } from "vitest";

describe("projectFormSchema", () => {
  it("名前を trim し、空の概要を null にする", () => {
    expect(
      projectFormSchema.parse({ name: "  新作RPG  ", description: "   " }),
    ).toEqual({ name: "新作RPG", description: null });
    expect(projectFormSchema.parse({ name: "新作RPG", description: "" })).toEqual({
      name: "新作RPG",
      description: null,
    });
  });

  it("名前が空・空白のみなら必須エラー", () => {
    const result = projectFormSchema.safeParse({ name: "  ", description: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("プロジェクト名を入力してください。");
    }
  });

  it("名前が上限超過ならエラー", () => {
    const result = projectFormSchema.safeParse({
      name: "あ".repeat(PROJECT_NAME_MAX + 1),
      description: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        `プロジェクト名は${PROJECT_NAME_MAX}文字以内で入力してください。`,
      );
    }
  });

  it("概要が上限超過ならエラー", () => {
    const result = projectFormSchema.safeParse({
      name: "新作",
      description: "あ".repeat(PROJECT_DESCRIPTION_MAX + 1),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        `概要は${PROJECT_DESCRIPTION_MAX}文字以内で入力してください。`,
      );
    }
  });
});

describe("projectListQuerySchema", () => {
  it("省略と不正な tab は all になる", () => {
    expect(projectListQuerySchema.parse({}).tab).toBe("all");
    expect(projectListQuerySchema.parse({ tab: "x" }).tab).toBe("all");
  });

  it("空白だけの q は undefined になる", () => {
    expect(projectListQuerySchema.parse({ q: "  " }).q).toBeUndefined();
  });

  it("上限超過の q と不正な cursor は失敗する", () => {
    expect(
      projectListQuerySchema.safeParse({ q: "あ".repeat(PROJECT_NAME_MAX + 1) }).success,
    ).toBe(false);
    expect(projectListQuerySchema.safeParse({ cursor: "abc" }).success).toBe(false);
  });

  it("following と cursor を受け付ける", () => {
    expect(
      projectListQuerySchema.parse({ tab: "following", q: "カピ", cursor: "12" }),
    ).toEqual({ tab: "following", q: "カピ", cursor: 12 });
  });
});
