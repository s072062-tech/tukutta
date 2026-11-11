// 共通 Empty / NotFound / Error / Loading 表示テスト
import { renderWithProviders } from "@/test/renderWithProviders";
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EmptyState } from "./EmptyState";
import { ErrorMessage } from "./ErrorMessage";
import { LoadingState } from "./LoadingState";
import { NotFoundState } from "./NotFoundState";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

describe("共通状態コンポーネント", () => {
  it("EmptyState にメッセージを出す", () => {
    renderWithProviders(<EmptyState message="まだプロジェクトがありません" />);
    expect(screen.getByText("まだプロジェクトがありません")).toBeInTheDocument();
  });

  it("NotFoundState に文言とホームリンクを出す", () => {
    renderWithProviders(<NotFoundState />);
    expect(screen.getByText("ページが見つかりません")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "ホームへ" })).toHaveAttribute("href", "/home");
  });

  it("ErrorMessage の再読み込みを呼べる", () => {
    const onRetry = vi.fn();
    renderWithProviders(<ErrorMessage message="失敗しました" onRetry={onRetry} />);
    fireEvent.click(screen.getByRole("button", { name: "再読み込み" }));
    expect(onRetry).toHaveBeenCalled();
  });

  it("LoadingState page が status を持つ", () => {
    renderWithProviders(<LoadingState variant="page" />);
    expect(screen.getByLabelText("読み込み中")).toBeInTheDocument();
  });
});
