// プロジェクト編集の取得・権限・保存・削除をまとめるビューコンポーネント
"use client";

import type {
  DeleteProjectResponse,
  UpdateProjectResponse,
} from "@/app/api/projects/[projectId]/route";
import { ProjectForm } from "@/app/(app)/_components/ProjectForm";
import { useProjectDetail } from "@/app/(app)/projects/[projectId]/_hooks/useProjectDetail";
import { Button } from "@/app/_components/common/Button";
import { ConfirmDialog } from "@/app/_components/common/ConfirmDialog";
import { ErrorMessage } from "@/app/_components/common/ErrorMessage";
import { LoadingState } from "@/app/_components/common/LoadingState";
import { NotFoundState } from "@/app/_components/common/NotFoundState";
import { apiDelete, apiPatch, ApiClientError } from "@/lib/apiClient";
import type { ProjectFormValues } from "@/lib/validations/project";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSWRConfig } from "swr";

type ProjectEditViewProps = {
  projectId: string;
  enabled: boolean;
};

// プロジェクト編集画面全体の状態分岐とUI表示
export function ProjectEditView({ projectId, enabled }: ProjectEditViewProps) {
  const router = useRouter();
  const { mutate: mutateGlobal } = useSWRConfig();
  const { detail, isLoading, isNotFound, error, mutate } = useProjectDetail(projectId, {
    enabled,
  });

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [notFoundAfterMutation, setNotFoundAfterMutation] = useState(false);

  if (!enabled || (isLoading && !detail)) {
    return <LoadingState variant="page" />;
  }

  if (isNotFound || notFoundAfterMutation) {
    return <NotFoundState />;
  }

  if (error && !detail) {
    return (
      <ErrorMessage
        message={error.message || "プロジェクトを読み込めませんでした。"}
        onRetry={() => void mutate()}
      />
    );
  }

  if (!detail) {
    return <LoadingState variant="page" />;
  }

  if (!detail.isOwner) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-[#1C2B2E]">このプロジェクトを編集する権限がありません</p>
        <Link
          href={`/projects/${detail.project.id}`}
          className="text-sm text-[#0F6E6B] underline"
        >
          プロジェクト情報へ
        </Link>
      </div>
    );
  }

  // プロジェクトを更新し詳細ページへ戻す
  const handleSubmit = async (values: ProjectFormValues) => {
    try {
      await apiPatch<UpdateProjectResponse>(`/api/projects/${detail.project.id}`, values);
      await mutateGlobal(`/api/projects/${detail.project.id}`);
      router.push(`/projects/${detail.project.id}`);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 404) {
        setNotFoundAfterMutation(true);
        return;
      }
      throw err;
    }
  };

  // プロジェクトを削除して成功時はユーザー詳細へ遷移
  const handleDelete = async () => {
    setDeleteLoading(true);
    setDeleteError(null);
    const ownerUserId = detail.owner.userId;
    try {
      await apiDelete<DeleteProjectResponse>(`/api/projects/${detail.project.id}`);
      await mutateGlobal(`/api/projects/${detail.project.id}`);
      router.push(`/users/${ownerUserId}`);
    } catch (err) {
      setDeleteOpen(false);
      if (err instanceof ApiClientError && err.status === 404) {
        setNotFoundAfterMutation(true);
        return;
      }
      if (err instanceof ApiClientError) {
        setDeleteError(err.message);
      } else {
        setDeleteError("エラーが発生しました。時間をおいて再度お試しください。");
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="rounded-2xl border border-[#DEE7E9] bg-white p-5">
        <ProjectForm
          title="プロジェクトを編集"
          submitLabel="保存する"
          defaultValues={{
            name: detail.project.name,
            description: detail.project.description ?? "",
          }}
          onSubmit={handleSubmit}
          footer={({ isSubmitting }) => (
            <Button
              type="button"
              variant="secondary"
              disabled={isSubmitting || deleteLoading}
              onClick={() => {
                setDeleteError(null);
                setDeleteOpen(true);
              }}
            >
              削除する
            </Button>
          )}
        />
        {deleteError ? (
          <p role="alert" className="mt-3 text-sm text-[#B42318]">
            {deleteError}
          </p>
        ) : null}
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="プロジェクトを削除"
        message="プロジェクトを削除しますか。タスク、フォロー、スタンプ、ハッシュタグの紐づけも削除されます。進捗投稿の本文は通常投稿として残ります。"
        confirmLabel="削除する"
        isLoading={deleteLoading}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
