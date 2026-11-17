// フォロー一覧クエリスキーマのユニットテスト
import { followListQuerySchema } from "@/lib/validations/follow";
import { describe, expect, it } from "vitest";

describe("followListQuerySchema", () => {
  it("空オブジェクトでは type が following になる", () => {
    expect(followListQuerySchema.parse({})).toEqual({ type: "following" });
  });

  it("following と followers を受け入れる", () => {
    expect(followListQuerySchema.parse({ type: "following" }).type).toBe("following");
    expect(followListQuerySchema.parse({ type: "followers" }).type).toBe("followers");
  });

  it("不正な type を拒否する", () => {
    expect(followListQuerySchema.safeParse({ type: "xxx" }).success).toBe(false);
  });

  it("不正な cursor を拒否する", () => {
    expect(followListQuerySchema.safeParse({ cursor: "abc" }).success).toBe(false);
  });

  it("正の整数の cursor を受け入れる", () => {
    expect(followListQuerySchema.parse({ cursor: "20" })).toEqual({
      type: "following",
      cursor: 20,
    });
  });
});
