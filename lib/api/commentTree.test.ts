// toCommentTree の入れ子とミュート親欠落のルート昇格テスト
import { toCommentTree, type CommentRow } from "@/lib/api/commentTree";
import { describe, expect, it } from "vitest";

function row(
  partial: Partial<CommentRow> & Pick<CommentRow, "id" | "body" | "parentCommentId">,
): CommentRow {
  return {
    createdAt: new Date(`2026-01-0${partial.id}T00:00:00.000Z`),
    author: { id: partial.id, userId: `u${partial.id}`, name: `User${partial.id}` },
    _count: { favorites: 0 },
    favorites: [],
    ...partial,
  };
}

describe("toCommentTree", () => {
  it("親・子・孫を入れ子にし兄弟は古い順のまま", () => {
    const tree = toCommentTree(
      [
        row({ id: 1, body: "親", parentCommentId: null }),
        row({ id: 2, body: "子1", parentCommentId: 1 }),
        row({ id: 3, body: "子2", parentCommentId: 1 }),
        row({ id: 4, body: "孫", parentCommentId: 2 }),
      ],
      1,
    );

    expect(tree).toHaveLength(1);
    expect(tree[0]?.body).toBe("親");
    expect(tree[0]?.canDelete).toBe(true);
    expect(tree[0]?.replies.map((r) => r.body)).toEqual(["子1", "子2"]);
    expect(tree[0]?.replies[0]?.replies[0]?.body).toBe("孫");
  });

  it("親が Map に無い返信はルートに出す", () => {
    const tree = toCommentTree(
      [row({ id: 2, body: "返信だけ", parentCommentId: 1 })],
      null,
    );
    expect(tree).toHaveLength(1);
    expect(tree[0]?.body).toBe("返信だけ");
    expect(tree[0]?.canDelete).toBe(false);
  });
});
