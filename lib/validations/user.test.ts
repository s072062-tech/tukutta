// createUserSchema の入力検証ユニットテスト
import { USER_NAME_MAX } from "@/lib/constants";
import { createUserSchema } from "@/lib/validations/user";
import { describe, expect, it } from "vitest";

describe("createUserSchema", () => {
  it("前後空白を trim して受け入れる", () => {
    const result = createUserSchema.parse({
      name: "  佐藤ゲームズ  ",
      userId: "  satogames  ",
    });
    expect(result).toEqual({ name: "佐藤ゲームズ", userId: "satogames" });
  });

  it("ユーザー名が空・空白のみなら必須エラー", () => {
    expect(createUserSchema.safeParse({ name: "", userId: "satogames" }).success).toBe(false);
    expect(createUserSchema.safeParse({ name: "   ", userId: "satogames" }).success).toBe(false);
    const empty = createUserSchema.safeParse({ name: "", userId: "satogames" });
    expect(empty.success).toBe(false);
    if (!empty.success) {
      expect(empty.error.issues[0]?.message).toBe("ユーザー名を入力してください。");
    }
  });

  it("ユーザー名が上限超過ならエラー", () => {
    const result = createUserSchema.safeParse({
      name: "あ".repeat(USER_NAME_MAX + 1),
      userId: "satogames",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        `ユーザー名は${USER_NAME_MAX}文字以内で入力してください。`,
      );
    }
  });

  it("ユーザーIDが空なら必須エラー", () => {
    const result = createUserSchema.safeParse({ name: "佐藤", userId: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("ユーザーIDを入力してください。");
    }
  });

  it("ユーザーIDが2文字・21文字・記号・@入りならエラー", () => {
    expect(createUserSchema.safeParse({ name: "佐藤", userId: "ab" }).success).toBe(false);
    expect(
      createUserSchema.safeParse({ name: "佐藤", userId: "a".repeat(21) }).success,
    ).toBe(false);
    expect(createUserSchema.safeParse({ name: "佐藤", userId: "sato!" }).success).toBe(false);

    const atResult = createUserSchema.safeParse({ name: "佐藤", userId: "@sato" });
    expect(atResult.success).toBe(false);
    if (!atResult.success) {
      expect(atResult.error.issues.some((i) => i.message.includes("@"))).toBe(true);
    }
  });

  it("許容されるユーザーIDを受け入れる", () => {
    expect(
      createUserSchema.parse({ name: "佐藤", userId: "Sato_Games-1" }),
    ).toEqual({ name: "佐藤", userId: "Sato_Games-1" });
  });
});
