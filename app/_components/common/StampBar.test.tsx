// StampBar のチップ表示・送信済み不可・追加ボタン・onSend 呼び出しテスト
import { renderWithProviders } from "@/test/renderWithProviders";
import type { StampSummary } from "@/types/stamp";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StampBar } from "./StampBar";

vi.mock("@emoji-mart/react", () => ({
  default: function MockPicker({
    onEmojiSelect,
  }: {
    onEmojiSelect: (emoji: { native: string }) => void;
  }) {
    return (
      <button
        type="button"
        onClick={() => onEmojiSelect({ native: "🔥" })}
      >
        mock-picker-select
      </button>
    );
  },
}));

vi.mock("@emoji-mart/data", () => ({
  default: {},
}));

const stamps: StampSummary[] = [
  { emoji: "🎉", count: 2, sentByMe: false },
  { emoji: "👍", count: 1, sentByMe: true },
];

describe("StampBar", () => {
  it("件数付きチップを表示し、送信済みは押せない", () => {
    renderWithProviders(<StampBar stamps={stamps} onSend={vi.fn()} />);
    expect(screen.getByRole("button", { name: /🎉 2/ })).toBeEnabled();
    expect(screen.getByRole("button", { name: /👍 1/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: "スタンプを追加" })).toBeEnabled();
  });

  it("未送信のチップ押下で onSend を呼ぶ", async () => {
    const onSend = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(<StampBar stamps={stamps} onSend={onSend} />);
    fireEvent.click(screen.getByRole("button", { name: /🎉 2/ }));
    await waitFor(() => {
      expect(onSend).toHaveBeenCalledWith("🎉");
    });
  });

  it("追加ボタンから Picker で選ぶと onSend を呼ぶ", async () => {
    const onSend = vi.fn().mockResolvedValue(undefined);
    renderWithProviders(<StampBar stamps={stamps} onSend={onSend} />);
    fireEvent.click(screen.getByRole("button", { name: "スタンプを追加" }));
    fireEvent.click(screen.getByRole("button", { name: "mock-picker-select" }));
    await waitFor(() => {
      expect(onSend).toHaveBeenCalledWith("🔥");
    });
  });
});
