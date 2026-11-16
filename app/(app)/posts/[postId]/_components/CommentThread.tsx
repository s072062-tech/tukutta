// 投稿詳細のコメント欄で、件数・新規入力・ツリー表示・返信・削除・お気に入りをまとめて扱うコンポーネント
"use client";

import type { CommentFavoriteResponse } from "@/app/api/comments/[commentId]/favorite/route";
import type { DeleteCommentResponse } from "@/app/api/comments/[commentId]/route";
import type { GetCommentsResponse } from "@/app/api/posts/[postId]/comments/route";
import { CommentItem } from "@/app/_components/common/CommentItem";
import { EmptyState } from "@/app/_components/common/EmptyState";
import { ErrorMessage } from "@/app/_components/common/ErrorMessage";
import { LoadingState } from "@/app/_components/common/LoadingState";
import { useLoginGuard } from "@/app/_hooks/useLoginGuard";
import { ApiClientError, apiDelete } from "@/lib/apiClient";
import type { CommentNode } from "@/types/comment";
import type { KeyedMutator } from "swr";
import { useState, type ReactNode } from "react";
import { CommentForm } from "./CommentForm";

type CommentThreadProps = {
  postId: number;
  comments: CommentNode[];
  isLoading: boolean;
  error?: Error;
  mutate: KeyedMutator<GetCommentsResponse>;
};

// 返信を含めたコメント総数を数える
function countNodes(nodes: CommentNode[]): number {
  return nodes.reduce((sum, node) => sum + 1 + countNodes(node.replies), 0);
}

// ツリー内の対象コメントのお気に入り状態だけを更新
function updateFavoriteInTree(
  nodes: CommentNode[],
  commentId: number,
  result: CommentFavoriteResponse,
): CommentNode[] {
  return nodes.map((node) => {
    if (node.id === commentId) {
      return {
        ...node,
        isFavorited: result.isFavorited,
        favoriteCount: result.favoriteCount,
      };
    }
    if (node.replies.length === 0) {
      return node;
    }
    return {
      ...node,
      replies: updateFavoriteInTree(node.replies, commentId, result),
    };
  });
}

// コメントUI全体を組み立てて表示
export function CommentThread({
  postId,
  comments,
  isLoading,
  error,
  mutate,
}: CommentThreadProps) {
  const { ensureLoggedIn } = useLoginGuard();
  const [replyTargetId, setReplyTargetId] = useState<number | null>(null);

  const totalCount = countNodes(comments);

  // ログイン確認後、そのコメントへの返信フォームを開く
  const handleReply = (parentCommentId: number) => {
    if (!ensureLoggedIn()) {
      return;
    }
    setReplyTargetId(parentCommentId);
  };

  // ログイン確認後にコメントを削除し一覧を再取得する
  const handleDelete = async (commentId: number) => {
    if (!ensureLoggedIn()) {
      return;
    }
    try {
      await apiDelete<DeleteCommentResponse>(`/api/comments/${commentId}`);
      setReplyTargetId((current) => (current === commentId ? null : current));
      await mutate();
    } catch {
      // 削除失敗時は一覧をそのままにし、再取得で最新にする
      await mutate();
    }
  };

  // お気に入り結果をローカルキャッシュのツリーに反映する
  const handleFavoriteChange = (commentId: number, result: CommentFavoriteResponse) => {
    void mutate(
      (current) =>
        current
          ? {
              comments: updateFavoriteInTree(current.comments, commentId, result),
            }
          : current,
      { revalidate: false },
    );
  };

  // コメントとその返信を再帰描画する
  const renderTree = (nodes: CommentNode[], depth: number): ReactNode =>
    nodes.map((node) => (
      <div key={node.id} className="space-y-3">
        <CommentItem
          comment={{ ...node, replies: [] }}
          depth={depth}
          onReply={handleReply}
          onDelete={handleDelete}
          onFavoriteChange={handleFavoriteChange}
        />
        {replyTargetId === node.id ? (
          <div style={{ paddingLeft: Math.min(depth + 1, 3) * 16 }}>
            <CommentForm
              postId={postId}
              parentCommentId={node.id}
              placeholder="返信を書く"
              submitLabel="返信する"
              onCancel={() => setReplyTargetId(null)}
              onSuccess={() => {
                setReplyTargetId(null);
                void mutate();
              }}
            />
          </div>
        ) : null}
        {node.replies.length > 0 ? renderTree(node.replies, depth + 1) : null}
      </div>
    ));

  return (
    <section className="space-y-4">
      <h2 className="text-base font-semibold text-[#1C2B2E]">コメント {totalCount}</h2>

      <CommentForm
        postId={postId}
        placeholder="フィードバックを書く"
        submitLabel="コメントする"
        onSuccess={() => {
          void mutate();
        }}
      />

      {isLoading ? <LoadingState variant="list" /> : null}

      {!isLoading && error ? (
        <ErrorMessage
          message={
            error instanceof ApiClientError && error.message
              ? error.message
              : "コメントを読み込めませんでした。"
          }
          onRetry={() => void mutate()}
        />
      ) : null}

      {!isLoading && !error && comments.length === 0 ? (
        <EmptyState message="まだコメントはありません" />
      ) : null}

      {!isLoading && !error && comments.length > 0 ? (
        <div className="space-y-4">{renderTree(comments, 0)}</div>
      ) : null}
    </section>
  );
}
