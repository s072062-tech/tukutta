// タスクの編集フォーム（ステータスは表示のみ）
"use client";

import type { UpdateTaskRequest } from "@/app/api/projects/[projectId]/tasks/[taskId]/route";
import { Button } from "@/app/_components/common/Button";
import { FormField } from "@/app/_components/common/FormField";
import { StatusBadge } from "@/app/_components/common/StatusBadge";
import { TextInput } from "@/app/_components/common/TextInput";
import { useAuth } from "@/app/_hooks/useAuth";
import { ApiClientError } from "@/lib/apiClient";
import {
  updateTaskSchema,
  type UpdateTaskInput,
} from "@/lib/validations/task";
import type { TaskStatus } from "@/types/task";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, type UseFormSetError } from "react-hook-form";

type TaskEditFormProps = {
  projectName: string;
  projectId: number;
  defaultName: string;
  status: TaskStatus;
  onSubmit: (values: UpdateTaskRequest) => Promise<void>;
  onDelete: () => void;
  isDeleting: boolean;
};

// APIのフィールドエラーをフォームに反映する
function applyFieldErrors(
  fieldErrors: Record<string, string[]> | undefined,
  setError: UseFormSetError<UpdateTaskInput>,
) {
  if (!fieldErrors) {
    return false;
  }
  const message = fieldErrors.name?.[0];
  if (message) {
    setError("name", { message });
    return true;
  }
  return false;
}

// タスク編集フォームのUIと送信・削除・エラー処理
export function TaskEditForm({
  projectName,
  projectId,
  defaultName,
  status,
  onSubmit,
  onDelete,
  isDeleting,
}: TaskEditFormProps) {
  const router = useRouter();
  const { mutate: mutateAuth } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UpdateTaskInput, unknown, UpdateTaskRequest>({
    resolver: zodResolver(updateTaskSchema),
    defaultValues: { name: defaultName },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  // バリデーション後のコールバック
  const submit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await onSubmit(values);
    } catch (error) {
      if (!(error instanceof ApiClientError)) {
        setFormError("エラーが発生しました。時間をおいて再度お試しください。");
        return;
      }
      if (error.status === 422) {
        if (applyFieldErrors(error.fieldErrors, setError)) {
          return;
        }
        setFormError(error.message);
        return;
      }
      if (error.status === 401) {
        await mutateAuth();
        router.push("/login");
        return;
      }
      if (error.status === 403 && error.code === "PROFILE_REQUIRED") {
        router.push("/signup?step=profile");
        return;
      }
      if (error.status === 404) {
        throw error;
      }
      setFormError(error.message);
    }
  });

  return (
    <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
      <Link
        href={`/projects/${projectId}`}
        className="text-sm text-[#0F6E6B] underline"
      >
        {projectName}
      </Link>
      <h1 className="text-sm font-bold text-[#1C2B2E]">タスクを編集</h1>

      <FormField label="タスク名" required htmlFor="task-edit-name" error={errors.name?.message}>
        <TextInput
          id="task-edit-name"
          hasError={Boolean(errors.name)}
          aria-invalid={Boolean(errors.name)}
          {...register("name")}
        />
      </FormField>

      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-[#1C2B2E]">現在のステータス</p>
        <StatusBadge status={status} />
        <p className="text-xs text-[#6A7B82]">ステータスは進捗投稿から変えられます</p>
      </div>

      {formError ? (
        <p role="alert" className="text-sm text-[#B42318]">
          {formError}
        </p>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="secondary"
          disabled={isSubmitting || isDeleting}
          onClick={onDelete}
        >
          削除する
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isDeleting}>
          保存する
        </Button>
      </div>
    </form>
  );
}
