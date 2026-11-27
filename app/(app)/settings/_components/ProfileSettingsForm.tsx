// アプリ設定のユーザー名変更フォーム
"use client";

import type {
  UpdateMeResponse,
  UserSelf,
} from "@/app/api/user-self/route";
import { Button } from "@/app/_components/common/Button";
import { ErrorMessage } from "@/app/_components/common/ErrorMessage";
import { FormField } from "@/app/_components/common/FormField";
import { TextInput } from "@/app/_components/common/TextInput";
import { useAuth } from "@/app/_hooks/useAuth";
import { apiPatch, ApiClientError } from "@/lib/apiClient";
import {
  updateMeSchema,
  type UpdateMeFormValues,
} from "@/lib/validations/user";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm, type UseFormSetError } from "react-hook-form";

const FORM_ERROR_MESSAGE = "エラーが発生しました。時間をおいて再度お試しください。";

type ProfileSettingsFormProps = {
  me: UserSelf;
};

function applyFieldErrors(
  fieldErrors: Record<string, string[]> | undefined,
  setError: UseFormSetError<UpdateMeFormValues>,
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

export function ProfileSettingsForm({ me }: ProfileSettingsFormProps) {
  const { mutate } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UpdateMeFormValues>({
    resolver: zodResolver(updateMeSchema),
    defaultValues: { name: me.name },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const nameRegister = register("name", {
    onChange: () => {
      setIsSaved(false);
    },
  });

  const onSubmit = async (values: UpdateMeFormValues) => {
    setFormError(null);
    try {
      const response = await apiPatch<UpdateMeResponse>("/api/user-self", values);
      await mutate(response, { revalidate: false });
      reset({ name: response.user.name });
      setIsSaved(true);
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.status === 422) {
          if (!applyFieldErrors(error.fieldErrors, setError)) {
            setFormError(error.message);
          }
          return;
        }
        if (error.status === 401 || error.status === 403) {
          await mutate();
          return;
        }
      }
      setFormError(FORM_ERROR_MESSAGE);
    }
  };

  return (
    <form noValidate className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)}>
      {formError ? <ErrorMessage message={formError} /> : null}
      <FormField label="ユーザー名" required error={errors.name?.message} htmlFor="name">
        <TextInput
          id="name"
          hasError={Boolean(errors.name)}
          autoComplete="nickname"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "name-error" : undefined}
          {...nameRegister}
        />
      </FormField>
      {/* <FormField
        label="ユーザーID"
        hint="ユーザーIDは変更できません。"
        htmlFor="userId-display"
      >
        <p id="userId-display" className="text-sm text-fg">
          @{me.userId}
        </p>
      </FormField> */}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" variant="primary" className="w-full sm:w-auto" isLoading={isSubmitting}>
          保存する
        </Button>
        {isSaved ? (
          <p role="status" className="text-sm font-medium text-accent-fg">
            保存しました
          </p>
        ) : null}
      </div>
    </form>
  );
}
