// sendStampSchema の入力検証ユニットテスト
import { EMOJI_MAX } from "@/lib/constants";
import { sendStampSchema } from "@/lib/validations/stamp";
import { describe, expect, it } from "vitest";

describe("sendStampSchema", () => {
  it("有効な絵文字を受け付ける", () => {
    expect(sendStampSchema.parse({ emoji: "🎉" })).toEqual({ emoji: "🎉" });
  });

  it("空と長すぎる emoji は失敗する", () => {
    expect(sendStampSchema.safeParse({ emoji: "" }).success).toBe(false);
    expect(sendStampSchema.safeParse({ emoji: " " }).success).toBe(false);
    expect(sendStampSchema.safeParse({ emoji: "あ".repeat(EMOJI_MAX + 1) }).success).toBe(
      false,
    );
  });
});
