// 投稿編集フォーム（通常投稿は本文のみ、進捗投稿はプロジェクト／タスク／ステータス＋本文）
"use client";

import type {
  UpdatePostRequest,
  UpdatePostResponse,
} from "@/app/api/posts/[postId]/route";
import type { PostDetail } from "@/app/api/posts/[postId]/route";
import type { MyProjectOption, MyTaskOption } from "@/app/api/me/projects/route";
import {
  ProgressSelectFields,
  type ProgressFieldValues,
} from "@/app/(app)/_components/ProgressSelectFields";
import { revalidatePostLists } from "@/app/(app)/home/_hooks/usePostList";
import { Button } from "@/app/_components/common/Button";
import { ErrorMessage } from "@/app/_components/common/ErrorMessage";
import { FormField } from "@/app/_components/common/FormField";
import { LoadingState } from "@/app/_components/common/LoadingState";
import { TextArea } from "@/app/_components/common/TextArea";
import { useAuth } from "@/app/_hooks/useAuth";
import { apiPatch, ApiClientError } from "@/lib/apiClient";
import {
  updatePostSchema,
  updateProgressPostSchema,
} from "@/lib/validations/post";
import type { TaskStatus } from "@/types/task";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  useForm,
  type Control,
  type FieldErrors,
  type Resolver,
  type UseFormRegister,
  type UseFormSetError,
} from "react-hook-form";
import { useSWRConfig } from "swr";

export type PostEditFormValues = ProgressFieldValues & {
  body: string;
};

type PostEditFormProps = {
  post: PostDetail;
  projects: MyProjectOption[];
  projectsLoading?: boolean;
  projectsError?: ApiClientError | null;
  onRetryProjects?: () => void;
};

// APIのフィールドエラーをフォームの各項目に反映する
function applyFieldErrors(
  fieldErrors: Record<string, string[]> | undefined,
  setError: UseFormSetError<PostEditFormValues>,
) {
  if (!fieldErrors) {
    return false;
  }
  let applied = false;
  for (const field of ["body", "projectId", "taskId", "status"] as const) {
    const message = fieldErrors[field]?.[0];
    if (message) {
      setError(field, { message });
      applied = true;
    }
  }
  return applied;
}

// 既存投稿の本文（進捗ならタスク・ステータスも）を保存する
export function PostEditForm({
  post,
  projects,
  projectsLoading = false,
  projectsError = null,
  onRetryProjects,
}: PostEditFormProps) {
  const router = useRouter();
  const { me, mutate: mutateAuth } = useAuth();
  const { mutate: mutateGlobal } = useSWRConfig();
  const [formError, setFormError] = useState<string | null>(null);
  const isProgress = post.progress !== null;

  const defaultValues: PostEditFormValues = isProgress && post.progress
    ? {
        body: post.body,
        projectId: post.progress.project.id,
        taskId: post.progress.taskId,
        status: post.progress.status,
      }
    : { body: post.body };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PostEditFormValues>({
    resolver: (isProgress
      ? zodResolver(updateProgressPostSchema)
      : zodResolver(updatePostSchema.pick({ body: true }))) as Resolver<PostEditFormValues>,
    defaultValues,
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const projectId = watch("projectId");
  const selectedProject = projects.find((project) => project.id === projectId);
  const readyEmpty =
    projects.length === 0 ||
    (selectedProject != null && selectedProject.tasks.length === 0);
  const selectDisabled = projects.length === 0;
  const submitDisabled =
    isSubmitting ||
    (isProgress && (projectsLoading || readyEmpty || Boolean(projectsError)));

  // 入力を送信して更新後に投稿詳細へ戻す
  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const payload: UpdatePostRequest = isProgress
        ? {
            body: values.body,
            projectId: values.projectId,
            taskId: values.taskId,
            status: values.status as TaskStatus,
          }
        : { body: values.body };

      await apiPatch<UpdatePostResponse>(`/api/posts/${post.id}`, payload);

      await revalidatePostLists();
      if (isProgress) {
        await mutateGlobal("/api/me/projects");
        await mutateGlobal(
          (key) => typeof key === "string" && key.startsWith("/api/projects/"),
          undefined,
          { revalidate: true },
        );
      }
      await mutateGlobal(`/api/posts/${post.id}`);
      router.push(`/posts/${post.id}`);
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
      setFormError(error.message);
    }
  });

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit} noValidate>
      {isProgress && projectsError ? (
        <ErrorMessage
          message="プロジェクトを読み込めませんでした。"
          onRetry={onRetryProjects}
        />
      ) : null}

      {isProgress && projectsLoading ? <LoadingState variant="card" /> : null}

      {isProgress && !projectsLoading && !projectsError ? (
        <ProgressSelectFields
          projects={projects}
          register={register as unknown as UseFormRegister<ProgressFieldValues>}
          control={control as unknown as Control<ProgressFieldValues>}
          errors={errors as FieldErrors<ProgressFieldValues>}
          disabled={selectDisabled}
          emptyHref={me ? `/users/${me.userId}` : null}
          onProjectChange={() => {
            setValue("taskId", undefined);
            setValue("status", undefined);
          }}
          onTaskChange={(task: MyTaskOption) => {
            setValue("status", task.status);
          }}
        />
      ) : null}

      <FormField label="本文" required htmlFor="post-edit-body" error={errors.body?.message}>
        <TextArea
          id="post-edit-body"
          rows={5}
          placeholder="いま作っていることを書く"
          hasError={Boolean(errors.body)}
          aria-invalid={Boolean(errors.body)}
          {...register("body")}
        />
      </FormField>

      {formError ? (
        <p role="alert" className="text-sm text-danger">
          {formError}
        </p>
      ) : null}

      <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={submitDisabled}>
        保存する
      </Button>
    </form>
  );
}
