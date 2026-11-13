// CommentItem のインデントと返信コールバックテスト
import { renderWithProviders } from "@/test/renderWithProviders";
import type { CommentNode } from "@/types/comment";
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CommentItem } from "./CommentItem";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

function makeComment(
  id: number,
  body: string,
  replies: CommentNode[] = [],
): CommentNode {
  return {
    id,
    body,
    createdAt: "2026-10-21T00:00:00.000Z",
    author: { id, userId: `user${id}`, name: `ユーザー${id}` },
    isFavorited: false,
    favoriteCount: 0,
    canDelete: false,
    replies,
  };
}

describe("CommentItem", () => {
  it("返信を3段までインデントして表示する", () => {
    const tree = makeComment(1, "ルート", [
      makeComment(2, "返信1", [makeComment(3, "返信2", [makeComment(4, "返信3")])]),
    ]);
    const { container } = renderWithProviders(
      <CommentItem comment={tree} depth={0} onReply={vi.fn()} />,
    );
    expect(screen.getByText("ルート")).toBeInTheDocument();
    expect(screen.getByText("返信1")).toBeInTheDocument();
    expect(screen.getByText("返信2")).toBeInTheDocument();
    expect(screen.getByText("返信3")).toBeInTheDocument();

    const articles = container.querySelectorAll("article");
    expect(articles[0]).toHaveStyle({ paddingLeft: "0px" });
    expect(articles[1]).toHaveStyle({ paddingLeft: "16px" });
    expect(articles[2]).toHaveStyle({ paddingLeft: "32px" });
    expect(articles[3]).toHaveStyle({ paddingLeft: "48px" });
  });

  it("返信ボタンで onReply を呼ぶ", () => {
    const onReply = vi.fn();
    renderWithProviders(
      <CommentItem comment={makeComment(10, "本文")} depth={0} onReply={onReply} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "返信" }));
    expect(onReply).toHaveBeenCalledWith(10);
  });
});
