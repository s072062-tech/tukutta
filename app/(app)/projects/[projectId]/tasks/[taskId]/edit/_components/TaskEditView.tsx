// タスク編集の取得結果に応じてフォーム・権限なし・404 を切り替えるコンポーネント
"use client";

import type {
  DeleteTaskResponse,
  UpdateTaskRequest,
  UpdateTaskResponse,
} from "@/app/api/projects/[projectId]/tasks/[taskId]/route";
import { ConfirmDialog } from "@/app/_components/common/ConfirmDialog";
import { ErrorMessage } from "@/app/_components/common/ErrorMessage";
import { LoadingState } from "@/app/_components/common/LoadingState";
import { NotFoundState } from "@/app/_components/common/NotFoundState";
import { useAuth } from "@/app/_hooks/useAuth";
import { apiDelete, apiPatch, ApiClientError } from "@/lib/apiClient";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSWRConfig } from "swr";
import { useTask } from "../_hooks/useTask";
import { TaskEditForm } from "./TaskEditForm";

type TaskEditViewProps = {
  projectId: string;
  taskId: string;
  enabled: boolean;
};

export function TaskEditView({ projectId, taskId, enabled }: TaskEditViewProps) {
  const router = useRouter();
  const { mutate: mutateAuth } = useAuth();
  const { mutate: mutateGlobal } = useSWRConfig();
  const { task, isLoading, isNotFound, isForbidden, error, mutate } = useTask(
    projectId,
    taskId,
    { enabled },
  );

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [notFoundAfterMutation, setNotFoundAfterMutation] = useState(false);

  // 401 / プロフィール未設定エラー時にログインやサインアップへ誘導する
  useEffect(() => {
    if (!(error instanceof ApiClientError)) {
      return;
    }
    if (error.status === 401) {
      void mutateAuth().then(() => router.push("/login"));
      return;
    }
    if (error.code === "PROFILE_REQUIRED") {
      router.replace("/signup?step=profile");
    }
  }, [error, mutateAuth, router]);

  if (
    error instanceof ApiClientError &&
    (error.status === 401 || error.code === "PROFILE_REQUIRED")
  ) {
    return <LoadingState variant="page" />;
  }

  if (!enabled || (isLoading && !task)) {
    return <LoadingState variant="page" />;
  }

  if (isNotFound || notFoundAfterMutation) {
    return <NotFoundState />;
  }

  if (isForbidden) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-[#1C2B2E]">このタスクを編集する権限がありません</p>
        <Link href={`/projects/${projectId}`} className="text-sm text-[#0F6E6B] underline">
          プロジェクト情報へ
        </Link>
      </div>
    );
  }

  if (error && !task) {
    return (
      <ErrorMessage
        message={error.message || "タスクを読み込めませんでした。"}
        onRetry={() => void mutate()}
      />
    );
  }

  if (!task) {
    return <LoadingState variant="page" />;
  }

  // タスクを更新しプロジェクト詳細へ戻す
  const handleSubmit = async (values: UpdateTaskRequest) => {
    try {
      await apiPatch<UpdateTaskResponse>(
        `/api/projects/${projectId}/tasks/${taskId}`,
        values,
      );
      await mutateGlobal(`/api/projects/${projectId}`);
      router.push(`/projects/${projectId}`);
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 404) {
        setNotFoundAfterMutation(true);
        return;
      }
      throw err;
    }
  };

  // タスクを削除し成功時はプロジェクト詳細へ戻す
  const handleDelete = async () => {
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await apiDelete<DeleteTaskResponse>(`/api/projects/${projectId}/tasks/${taskId}`);
      await mutateGlobal(`/api/projects/${projectId}`);
      router.push(`/projects/${projectId}`);
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
        <TaskEditForm
          projectName={task.project.name}
          projectId={task.project.id}
          defaultName={task.task.name}
          status={task.task.status}
          onSubmit={handleSubmit}
          isDeleting={deleteLoading}
          onDelete={() => {
            setDeleteError(null);
            setDeleteOpen(true);
          }}
        />
        {deleteError ? (
          <p role="alert" className="mt-3 text-sm text-[#B42318]">
            {deleteError}
          </p>
        ) : null}
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="タスクを削除"
        message="タスクを削除しますか。進捗投稿の本文は通常投稿として残り、歩みからは消えます。"
        confirmLabel="削除する"
        isLoading={deleteLoading}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
