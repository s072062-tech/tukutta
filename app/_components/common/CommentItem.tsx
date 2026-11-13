// 投稿詳細のコメント1件と返信ツリーを再帰表示する共通コンポーネント
"use client";

import { formatLongDateTime } from "@/lib/format";
import type { CommentNode } from "@/types/comment";
import { Avatar } from "./Avatar";
import { UserNameLink } from "./UserNameLink";

type CommentItemProps = {
  comment: CommentNode;
  depth: number;
  onReply: (parentCommentId: number) => void;
  onDelete?: (commentId: number) => void;
};

const MAX_INDENT_DEPTH = 3;

// アバター・作者・日時・本文・返信／削除を描画し、replies を再帰する
export function CommentItem({ comment, depth, onReply, onDelete }: CommentItemProps) {
  const indentLevel = Math.min(depth, MAX_INDENT_DEPTH);
  const paddingLeft = indentLevel * 16;

  return (
    <div className="space-y-3">
      <article className="flex gap-3" style={{ paddingLeft }}>
        <Avatar
          name={comment.author.name}
          id={comment.author.id}
          userId={comment.author.userId}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <UserNameLink user={comment.author} />
            <time className="text-xs text-[#8A9AA0]" dateTime={comment.createdAt}>
              {formatLongDateTime(comment.createdAt)}
            </time>
          </div>
          <p className="mt-1 whitespace-pre-wrap text-sm text-[#1C2B2E]">{comment.body}</p>
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              className="text-xs font-medium text-[#0F6E6B] hover:underline"
              onClick={() => onReply(comment.id)}
            >
              返信
            </button>
            {onDelete && comment.canDelete ? (
              <button
                type="button"
                className="text-xs font-medium text-[#6A7B82] hover:underline"
                onClick={() => onDelete(comment.id)}
              >
                削除
              </button>
            ) : null}
          </div>
        </div>
      </article>
      {comment.replies.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          depth={depth + 1}
          onReply={onReply}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
