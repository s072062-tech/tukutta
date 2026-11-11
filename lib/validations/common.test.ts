// 共通パス／クエリスキーマのユニットテスト
import {
  cursorQuerySchema,
  idParamSchema,
  userIdParamSchema,
} from "@/lib/validations/common";
import { describe, expect, it } from "vitest";

describe("idParamSchema", () => {
  it("正の整数を受け入れる", () => {
    expect(idParamSchema.parse("12")).toBe(12);
    expect(idParamSchema.parse(3)).toBe(3);
  });

  it("非整数・0・負数を拒否する", () => {
    expect(idParamSchema.safeParse("abc").success).toBe(false);
    expect(idParamSchema.safeParse("1.5").success).toBe(false);
    expect(idParamSchema.safeParse("0").success).toBe(false);
    expect(idParamSchema.safeParse("-1").success).toBe(false);
  });
});

describe("userIdParamSchema", () => {
  it("ハンドル形式を受け入れる", () => {
    expect(userIdParamSchema.parse("satogames")).toBe("satogames");
  });

  it("不正なハンドルを拒否する", () => {
    expect(userIdParamSchema.safeParse("ab").success).toBe(false);
    expect(userIdParamSchema.safeParse("sato!").success).toBe(false);
    expect(userIdParamSchema.safeParse("@sato").success).toBe(false);
  });
});

describe("cursorQuerySchema", () => {
  it("正の整数を受け入れる", () => {
    expect(cursorQuerySchema.parse("20")).toBe(20);
  });

  it("不正な cursor を拒否する", () => {
    expect(cursorQuerySchema.safeParse("0").success).toBe(false);
    expect(cursorQuerySchema.safeParse("abc").success).toBe(false);
    expect(cursorQuerySchema.safeParse("-3").success).toBe(false);
  });
});
