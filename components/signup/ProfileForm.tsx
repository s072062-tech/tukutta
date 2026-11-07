// ユーザー登録の第2ステップ（プロフィール登録）画面コンポーネント
"use client";

import type { CreateUserResponse } from "@/app/api/users/route";
import { AuthCard } from "@/components/auth/AuthCard";
import { SignupSteps } from "@/components/auth/SignupSteps";
import { Button } from "@/components/common/Button";
import { ErrorMessage } from "@/components/common/ErrorMessage";
import { FormField } from "@/components/common/FormField";
import { TextInput } from "@/components/common/TextInput";
import { useAuth } from "@/hooks/useAuth";
import { ApiClientError, apiPost } from "@/lib/apiClient";
import { createUserSchema, type CreateUserFormValues } from "@/lib/validations/user";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, type UseFormSetError } from "react-hook-form";

const FORM_ERROR_MESSAGE = "エラーが発生しました。時間をおいて再度お試しください。";

// APIのフィールドエラーをreact-hook-formの各項目エラーに反映する
function applyFieldErrors(
  fieldErrors: Record<string, string[]> | undefined,
  setError: UseFormSetError<CreateUserFormValues>,
) {
  if (!fieldErrors) {
    return false;
  }
  let applied = false;
  for (const field of ["name", "userId"] as const) {
    const message = fieldErrors[field]?.[0];
    if (message) {
      setError(field, { message });
      applied = true;
    }
  }
  return applied;
}

export function ProfileForm() {
  const router = useRouter();
  const { mutate } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  // ユーザープロフィール送信処理
  const onSubmit = async (values: CreateUserFormValues) => {
    setFormError(null);
    try {
      await apiPost<CreateUserResponse>("/api/users", values);
      await mutate();
      router.replace("/home");
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.status === 422) {
          if (!applyFieldErrors(error.fieldErrors, setError)) {
            setFormError(error.message);
          }
          return;
        }
        if (error.status === 409 && error.fieldErrors?.userId?.[0]) {
          setError("userId", { message: error.fieldErrors.userId[0] });
          return;
        }
        if (error.status === 409) {
          setFormError(error.message);
          await mutate();
          router.replace("/home");
          return;
        }
        if (error.status === 401) {
          await mutate();
          return;
        }
      }
      setFormError(FORM_ERROR_MESSAGE);
    }
  };

  // AuthCard, FormField, TextInput でユーザープロフィール登録フォームを表示
  return (
    <AuthCard
      header={<SignupSteps currentStep={2} />}
      title="ユーザー情報を登録"
      badge={
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#E7F3F1] px-3 py-1 text-xs font-medium text-[#0F6E6B]">
          <Check className="h-3.5 w-3.5" aria-hidden />
          Google認証済み
        </span>
      }
    >
      <form noValidate className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
        {formError ? <ErrorMessage message={formError} /> : null}
        <FormField label="ユーザー名" required error={errors.name?.message} htmlFor="name">
          <TextInput
            id="name"
            hasError={Boolean(errors.name)}
            placeholder="例：佐藤ゲームズ"
            autoComplete="nickname"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "name-error" : undefined}
            {...register("name")}
          />
        </FormField>
        <FormField
          label="ユーザーID"
          required
          hint="プロフィールのURLに使われます。"
          error={errors.userId?.message}
          htmlFor="userId"
        >
          <TextInput
            id="userId"
            hasError={Boolean(errors.userId)}
            placeholder="例：satogames"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            aria-invalid={Boolean(errors.userId)}
            aria-describedby={errors.userId ? "userId-error" : undefined}
            {...register("userId")}
          />
        </FormField>
        <Button type="submit" variant="primary" className="w-full" isLoading={isSubmitting}>
          登録を完了する
        </Button>
      </form>
    </AuthCard>
  );
}
