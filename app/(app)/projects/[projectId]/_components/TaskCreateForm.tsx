// タスク登録フォーム（プロジェクトのオーナーユーザのみ登録可能）
"use client";

import type { CreateTaskResponse } from "@/app/api/projects/[projectId]/tasks/route";
import { Button } from "@/app/_components/common/Button";
import { FormField } from "@/app/_components/common/FormField";
import { Select } from "@/app/_components/common/Select";
import { TextInput } from "@/app/_components/common/TextInput";
import { useLoginGuard } from "@/app/_hooks/useLoginGuard";
import { TASK_NAME_MAX, TASK_STATUSES } from "@/lib/constants";
import { ApiClientError, apiPost } from "@/lib/apiClient";
import {
  createTaskSchema,
  type CreateTaskInput,
  type CreateTaskValues,
} from "@/lib/validations/task";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm, type UseFormSetError } from "react-hook-form";

type TaskCreateFormProps = {
  projectId: number;
  onCreated: () => Promise<void>;
};

function applyFieldErrors(
  fieldErrors: Record<string, string[]> | undefined,
  setError: UseFormSetError<CreateTaskInput>,
) {
  if (!fieldErrors) {
    return false;
  }
  let applied = false;
  for (const field of ["name", "status"] as const) {
    const message = fieldErrors[field]?.[0];
    if (message) {
      setError(field, { message });
      applied = true;
    }
  }
  return applied;
}

export function TaskCreateForm({ projectId, onCreated }: TaskCreateFormProps) {
  const { ensureLoggedIn } = useLoginGuard();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateTaskInput, unknown, CreateTaskValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: { name: "", status: "未着手" },
    mode: "onSubmit",
  });

  const submit = handleSubmit(async (values) => {
    if (!ensureLoggedIn()) {
      return;
    }
    setFormError(null);
    try {
      await apiPost<CreateTaskResponse>(`/api/projects/${projectId}/tasks`, values);
      await onCreated();
      reset({ name: "", status: "未着手" });
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
      setFormError(error.message);
    }
  });

  return (
    <form
      className="rounded-2xl border border-[#DEE7E9] bg-white p-4"
      onSubmit={submit}
      noValidate
    >
      <h2 className="text-sm font-semibold text-[#1C2B2E]">タスクを登録</h2>
      <div className="mt-3 flex flex-col gap-3">
        <FormField
          label="タスク名"
          required
          htmlFor="task-name"
          error={errors.name?.message}
        >
          <TextInput
            id="task-name"
            placeholder="新しいタスク名"
            maxLength={TASK_NAME_MAX}
            hasError={Boolean(errors.name)}
            aria-invalid={Boolean(errors.name)}
            {...register("name")}
          />
        </FormField>
        <FormField
          label="初期ステータス"
          htmlFor="task-status"
          error={errors.status?.message}
        >
          <Select
            id="task-status"
            hasError={Boolean(errors.status)}
            aria-invalid={Boolean(errors.status)}
            {...register("status")}
          >
            {TASK_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
        </FormField>
        {formError ? <p className="text-sm text-[#B42318]">{formError}</p> : null}
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          icon={<Plus className="h-4 w-4" />}
        >
          登録する
        </Button>
      </div>
    </form>
  );
}
