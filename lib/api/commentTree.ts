// PostComment のフラット行を CommentNode のツリーに組み立てる
import type { CommentNode } from "@/types/comment";
import type { UserSummary } from "@/types/user";

export type CommentRow = {
  id: number;
  body: string;
  createdAt: Date;
  parentCommentId: number | null;
  author: UserSummary;
  _count: { favorites: number };
  favorites: { id: number }[] | false;
};

// クエリ順（古い順）を保ったまま親子を入れ子にする。親が無い行はルートへ出す
export function toCommentTree(
  rows: CommentRow[],
  viewerId: number | null,
): CommentNode[] {
  const nodes = new Map<number, CommentNode>();

  for (const row of rows) {
    const isFavorited = Array.isArray(row.favorites) ? row.favorites.length > 0 : false;
    nodes.set(row.id, {
      id: row.id,
      body: row.body,
      createdAt: row.createdAt.toISOString(),
      author: row.author,
      isFavorited,
      favoriteCount: row._count.favorites,
      canDelete: viewerId !== null && viewerId === row.author.id,
      replies: [],
    });
  }

  const roots: CommentNode[] = [];
  for (const row of rows) {
    const node = nodes.get(row.id);
    if (!node) {
      continue;
    }
    const parentId = row.parentCommentId;
    if (parentId == null || !nodes.has(parentId)) {
      roots.push(node);
      continue;
    }
    nodes.get(parentId)?.replies.push(node);
  }

  return roots;
}
