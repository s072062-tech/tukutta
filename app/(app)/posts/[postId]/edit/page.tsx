// 投稿編集画面 (/posts/{postId}/edit)（投稿ユーザーのみ・削除確認付き）
"use client";

import { useMyProjects } from "@/app/(app)/_hooks/useMyProjects";
import { usePostDetail } from "@/app/(app)/posts/[postId]/_hooks/usePostDetail";
import { revalidatePostLists } from "@/app/(app)/home/_hooks/usePostList";
import { Button } from "@/app/_components/common/Button";
import { ConfirmDialog } from "@/app/_components/common/ConfirmDialog";
import { ErrorMessage } from "@/app/_components/common/ErrorMessage";
import { LoadingState } from "@/app/_components/common/LoadingState";
import { NotFoundState } from "@/app/_components/common/NotFoundState";
import { useRequireAuth } from "@/app/_hooks/useRequireAuth";
import { apiDelete, ApiClientError } from "@/lib/apiClient";
import type { DeletePostResponse } from "@/app/api/posts/[postId]/route";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { PostEditForm } from "./_components/PostEditForm";

// URLのpostIdを正の整数に変換
function parsePostId(raw: string | undefined) {
  if (raw == null || raw === "") {
    return null;
  }
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    return null;
  }
  return value;
}

// 投稿編集画面全体の状態分岐・フォーム表示・削除処理
export default function PostEditPage() {
  const params = useParams<{ postId: string }>();
  const rawPostId = typeof params.postId === "string" ? params.postId : undefined;
  const parsedId = parsePostId(rawPostId);
  const { isReady } = useRequireAuth();
  const router = useRouter();

  const postId = isReady ? parsedId : null;
  const { post, isLoading, isNotFound, error, mutate } = usePostDetail(postId);

  const canEdit = post?.canEdit === true;
  const isProgress = post?.progress != null;
  const {
    projects,
    isLoading: projectsLoading,
    error: projectsError,
    mutate: mutateProjects,
  } = useMyProjects(Boolean(canEdit && isProgress));

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (!isReady || (postId != null && isLoading && !post)) {
    return <LoadingState variant="page" />;
  }

  if (parsedId == null || isNotFound) {
    return <NotFoundState />;
  }

  if (error && !post) {
    return (
      <ErrorMessage
        message={error.message || "投稿を読み込めませんでした。"}
        onRetry={() => void mutate()}
      />
    );
  }

  if (!post) {
    return <LoadingState variant="page" />;
  }

  if (!post.canEdit) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-fg">この投稿を編集する権限がありません</p>
        <Link href={`/posts/${post.id}`} className="text-sm text-accent-fg underline">
          投稿詳細へ
        </Link>
      </div>
    );
  }

  // 投稿を削除して成功時はホームへ遷移する
  const handleDelete = async () => {
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await apiDelete<DeletePostResponse>(`/api/posts/${post.id}`);
      await revalidatePostLists();
      router.push("/home");
    } catch (err) {
      setDeleteOpen(false);
      if (err instanceof ApiClientError) {
        setDeleteError(
          err.message || "投稿を削除できませんでした。時間をおいて再度お試しください。",
        );
      } else {
        setDeleteError("投稿を削除できませんでした。時間をおいて再度お試しください。");
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-lg font-bold text-fg">投稿を編集</h1>
        <Link href={`/posts/${post.id}`} className="text-sm text-accent-fg underline">
          投稿詳細へ
        </Link>
      </div>

      <PostEditForm
        post={post}
        projects={projects}
        projectsLoading={projectsLoading}
        projectsError={projectsError ?? null}
        onRetryProjects={() => void mutateProjects()}
      />

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setDeleteError(null);
            setDeleteOpen(true);
          }}
        >
          削除する
        </Button>
        {deleteError ? (
          <p role="alert" className="text-sm text-danger">
            {deleteError}
          </p>
        ) : null}
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="投稿を削除しますか"
        message="この投稿のコメント、スタンプ、お気に入り、ハッシュタグの紐づけも削除されます。削除すると元に戻せません。"
        confirmLabel="削除する"
        isLoading={deleteLoading}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
