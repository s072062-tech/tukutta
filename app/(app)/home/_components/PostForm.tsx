// ホームで通常投稿と進捗投稿を入力・送信し、成功後に投稿詳細へ進むフォーム
"use client";

import type {
  CreatePostRequest,
  CreatePostResponse,
} from "@/app/api/posts/route";
import type { MyTaskOption } from "@/app/api/me/projects/route";
import {
  ProgressSelectFields,
  type PostFormValues,
  type ProgressFieldValues,
} from "@/app/(app)/_components/ProgressSelectFields";
import { useMyProjects } from "@/app/(app)/_hooks/useMyProjects";
import { revalidatePostLists } from "@/app/(app)/home/_hooks/usePostList";
import { Button } from "@/app/_components/common/Button";
import { ErrorMessage } from "@/app/_components/common/ErrorMessage";
import { FormField } from "@/app/_components/common/FormField";
import { LoadingState } from "@/app/_components/common/LoadingState";
import { SegmentedControl } from "@/app/_components/common/SegmentedControl";
import { TextArea } from "@/app/_components/common/TextArea";
import { useAuth } from "@/app/_hooks/useAuth";
import { useLoginGuard } from "@/app/_hooks/useLoginGuard";
import { apiPost, ApiClientError } from "@/lib/apiClient";
import { createPostSchema } from "@/lib/validations/post";
import { zodResolver } from "@hookform/resolvers/zod";
import { Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  useForm,
  type Control,
  type FieldErrors,
  type Resolver,
  type UseFormRegister,
  type UseFormSetError,
} from "react-hook-form";
import { useSWRConfig } from "swr";

const KIND_ITEMS = [
  { key: "normal", label: "通常" },
  { key: "progress", label: "進捗" },
] as const;

// API のフィールドエラーをフォームの各項目エラーに載せる
function applyFieldErrors(
  fieldErrors: Record<string, string[]> | undefined,
  setError: UseFormSetError<PostFormValues>,
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

// 通常と進捗の投稿を入力・送信し、成功後に投稿詳細へ進む
export function PostForm() {
  const router = useRouter();
  const { status, me, mutate: mutateAuth } = useAuth();
  const { ensureLoggedIn } = useLoginGuard();
  const { mutate: mutateGlobal } = useSWRConfig();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PostFormValues>({
    resolver: zodResolver(createPostSchema) as Resolver<PostFormValues>,
    defaultValues: { kind: "normal", body: "" },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const kind = watch("kind");
  const projectId = watch("projectId");
  const isProgress = kind === "progress";

  const {
    projects,
    isLoading: projectsLoading,
    error: projectsError,
    mutate: mutateProjects,
  } = useMyProjects(isProgress);

  const selectedProject = projects.find((project) => project.id === projectId);
  const readyEmpty =
    status === "ready" &&
    (projects.length === 0 ||
      (selectedProject != null && selectedProject.tasks.length === 0));
  const selectDisabled = status !== "ready" || projects.length === 0;
  const submitDisabled =
    status === "ready" &&
    isProgress &&
    !projectsLoading &&
    (projects.length === 0 ||
      (selectedProject != null && selectedProject.tasks.length === 0));

  const emptyHref =
    status === "ready" && me && readyEmpty ? `/users/${me.userId}` : null;

  // 投稿種別を切り替え通常に戻すとき進捗用フィールドをクリア
  const handleKindChange = (key: string) => {
    const nextKind = key === "progress" ? "progress" : "normal";
    setValue("kind", nextKind);
    if (nextKind === "normal") {
      setValue("projectId", undefined);
      setValue("taskId", undefined);
      setValue("status", undefined);
    }
  };

  // プロジェクト変更時にタスクとステータスをリセット
  const handleProjectChange = () => {
    setValue("taskId", undefined);
    setValue("status", undefined);
  };

  // 選んだタスクの現在ステータスをフォームにセット
  const handleTaskChange = (task: MyTaskOption) => {
    setValue("status", task.status);
  };

  // バリデーション通過後に投稿APIを呼び、再検証して詳細へ遷移
  const onValid = async (values: PostFormValues) => {
    setFormError(null);
    try {
      const body: CreatePostRequest =
        values.kind === "normal"
          ? { kind: "normal", body: values.body }
          : {
              kind: "progress",
              body: values.body,
              projectId: values.projectId!,
              taskId: values.taskId!,
              status: values.status!,
            };

      const result = await apiPost<CreatePostResponse>("/api/posts", body);
      await revalidatePostLists();
      if (values.kind === "progress") {
        await mutateProjects();
        await mutateGlobal(
          (key) =>
            typeof key === "string" &&
            key.startsWith(`/api/projects/${values.projectId}`),
          undefined,
          { revalidate: true },
        );
      }
      router.push(`/posts/${result.post.id}`);
    } catch (error) {
      if (!(error instanceof ApiClientError)) {
        setFormError("投稿できませんでした。時間をおいて再度お試しください。");
        return;
      }
      if (error.status === 422) {
        if (applyFieldErrors(error.fieldErrors, setError)) {
          return;
        }
        setFormError(
          error.message || "投稿できませんでした。時間をおいて再度お試しください。",
        );
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
      setFormError(
        error.message || "投稿できませんでした。時間をおいて再度お試しください。",
      );
    }
  };

  // ログイン確認してフォーム送信を実行
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!ensureLoggedIn()) {
      return;
    }
    void handleSubmit(onValid)(event);
  };

  return (
    <form
      className="rounded-2xl border border-[#DEE7E9] bg-white p-5 shadow-sm"
      onSubmit={submit}
      noValidate
    >
      <SegmentedControl
        items={[...KIND_ITEMS]}
        activeKey={kind}
        onChange={handleKindChange}
      />

      {isProgress ? (
        <div className="mt-4">
          {projectsLoading ? (
            <LoadingState variant="card" />
          ) : projectsError ? (
            <ErrorMessage
              message={
                projectsError.message || "プロジェクトを読み込めませんでした。"
              }
              onRetry={() => void mutateProjects()}
            />
          ) : (
            <ProgressSelectFields
              projects={projects}
              register={register as unknown as UseFormRegister<ProgressFieldValues>}
              control={control as unknown as Control<ProgressFieldValues>}
              errors={errors as FieldErrors<ProgressFieldValues>}
              disabled={selectDisabled}
              emptyHref={emptyHref}
              onProjectChange={handleProjectChange}
              onTaskChange={handleTaskChange}
            />
          )}
        </div>
      ) : null}

      <div className="mt-4">
        {isProgress ? (
          <FormField
            label="本文"
            required
            htmlFor="post-body"
            error={errors.body?.message}
          >
            <TextArea
              id="post-body"
              rows={4}
              placeholder="いま作っていることを書く"
              hasError={Boolean(errors.body)}
              {...register("body")}
            />
          </FormField>
        ) : (
          <div className="flex flex-col gap-1.5">
            <TextArea
              id="post-body"
              rows={4}
              placeholder="いま作っていることを書く"
              hasError={Boolean(errors.body)}
              aria-label="本文"
              {...register("body")}
            />
            {errors.body?.message ? (
              <p className="text-sm text-[#B42318]">{errors.body.message}</p>
            ) : null}
          </div>
        )}
      </div>

      {formError ? (
        <p role="alert" className="mt-3 text-sm text-[#B42318]">
          {formError}
        </p>
      ) : null}

      <div className="mt-4 flex items-center justify-between gap-4">
        <p className="text-sm text-[#6A7B82]">
          {isProgress
            ? "小さな一歩も、プロジェクトの記録に。"
            : "今日の小さな「つくった」を。"}
        </p>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          disabled={submitDisabled}
          icon={<Send className="h-4 w-4" />}
        >
          投稿する
        </Button>
      </div>
    </form>
  );
}
