// createTaskSchema の入力検証ユニットテスト
import { TASK_NAME_MAX } from "@/lib/constants";
import { createTaskSchema } from "@/lib/validations/task";
import { describe, expect, it } from "vitest";

describe("createTaskSchema", () => {
  it("名前を trim しステータスを受け付ける", () => {
    expect(
      createTaskSchema.parse({ name: "  マップ生成  ", status: "進行中" }),
    ).toEqual({ name: "マップ生成", status: "進行中" });
  });

  it("空の名前は必須エラー", () => {
    const result = createTaskSchema.safeParse({ name: "  ", status: "未着手" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("タスク名を入力してください。");
    }
  });

  it("上限超過の名前と不正なステータスは失敗する", () => {
    expect(
      createTaskSchema.safeParse({
        name: "あ".repeat(TASK_NAME_MAX + 1),
        status: "未着手",
      }).success,
    ).toBe(false);
    const statusResult = createTaskSchema.safeParse({ name: "タスク", status: "途中" });
    expect(statusResult.success).toBe(false);
    if (!statusResult.success) {
      expect(statusResult.error.issues[0]?.message).toBe("ステータスを選んでください。");
    }
  });
});
