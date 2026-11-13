// Select / SegmentedControl / ConfirmDialog の基本動作テスト
import { renderWithProviders } from "@/test/renderWithProviders";
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "./ConfirmDialog";
import { SegmentedControl } from "./SegmentedControl";
import { Select } from "./Select";

describe("フォーム・ダイアログ部品", () => {
  it("Select に選択肢を出せる", () => {
    renderWithProviders(
      <Select aria-label="ステータス" defaultValue="進行中">
        <option value="未着手">未着手</option>
        <option value="進行中">進行中</option>
        <option value="完了">完了</option>
      </Select>,
    );
    expect(screen.getByRole("combobox", { name: "ステータス" })).toHaveValue("進行中");
  });

  it("SegmentedControl の切替で onChange が呼ばれる", () => {
    const onChange = vi.fn();
    renderWithProviders(
      <SegmentedControl
        items={[
          { key: "normal", label: "通常" },
          { key: "progress", label: "進捗" },
        ]}
        activeKey="normal"
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "進捗" }));
    expect(onChange).toHaveBeenCalledWith("progress");
  });

  it("ConfirmDialog が開いているとき確認とキャンセルを呼べる", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    renderWithProviders(
      <ConfirmDialog
        open
        title="投稿を削除しますか"
        message="削除すると元に戻せません。"
        confirmLabel="削除する"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );
    expect(screen.getByText("投稿を削除しますか")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "削除する" }));
    expect(onConfirm).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));
    expect(onCancel).toHaveBeenCalled();
  });
});
