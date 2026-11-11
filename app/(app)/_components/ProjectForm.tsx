// プロジェクトの登録・編集で共有する名前と概要の入力フォーム
"use client";

import { Button } from "@/app/_components/common/Button";
import { FormField } from "@/app/_components/common/FormField";
import { TextArea } from "@/app/_components/common/TextArea";
import { TextInput } from "@/app/_components/common/TextInput";
import { useAuth } from "@/app/_hooks/useAuth";
import { ApiClientError } from "@/lib/apiClient";
import {
  projectFormSchema,
  type ProjectFormInput,
  type ProjectFormValues,
} from "@/lib/validations/project";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";
import { useForm, type UseFormSetError } from "react-hook-form";

type ProjectFormProps = {
  submitLabel: string;
  submitIcon?: ReactNode;
  defaultValues?: ProjectFormInput;
  onSubmit: (values: ProjectFormValues) => Promise<void>;
};

// APIのフィールドエラーを react-hook-form の各項目に設定する
function applyFieldErrors(
  fieldErrors: Record<string, string[]> | undefined,
  setError: UseFormSetError<ProjectFormInput>,
) {
  if (!fieldErrors) {
    return false;
  }
  let applied = false;
  for (const field of ["name", "description"] as const) {
    const message = fieldErrors[field]?.[0];
    if (message) {
      setError(field, { message });
      applied = true;
    }
  }
  return applied;
}

// バリデーション付きで入力を受け取り onSubmit を呼ぶ共有フォーム
export function ProjectForm({
  submitLabel,
  submitIcon,
  defaultValues,
  onSubmit,
}: ProjectFormProps) {
  const router = useRouter();
  const { mutate: mutateAuth } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormInput, unknown, ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: defaultValues ?? { name: "", description: "" },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await onSubmit(values);
    } catch (error) {
      if (!(error instanceof ApiClientError)) {
        setFormError("エラーが発生しました。時間をおいて再度お試しください。");
        return;
      }
      // 項目エラーをフォームに反映
      if (error.status === 422) {
        if (applyFieldErrors(error.fieldErrors, setError)) {
          return;
        }
        setFormError(error.message);
        return;
      }
      // 再認証してログインへ
      if (error.status === 401) {
        await mutateAuth();
        router.push("/login");
        return;
      }
      // プロフィール未設定の 403 はsignupへ
      if (error.status === 403 && error.code === "PROFILE_REQUIRED") {
        router.push("/signup?step=profile");
        return;
      }
      setFormError(error.message);
    }
  });

  return (
    <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
      <FormField label="プロジェクト名" required htmlFor="project-name" error={errors.name?.message}>
        <TextInput
          id="project-name"
          hasError={Boolean(errors.name)}
          aria-invalid={Boolean(errors.name)}
          {...register("name")}
        />
      </FormField>
      <FormField
        label="概要（任意）"
        htmlFor="project-description"
        error={errors.description?.message}
      >
        <TextArea
          id="project-description"
          rows={3}
          hasError={Boolean(errors.description)}
          aria-invalid={Boolean(errors.description)}
          {...register("description")}
        />
      </FormField>
      {formError ? (
        <p role="alert" className="text-sm text-[#B42318]">
          {formError}
        </p>
      ) : null}
      <Button type="submit" variant="primary" isLoading={isSubmitting} icon={submitIcon}>
        {submitLabel}
      </Button>
    </form>
  );
}
