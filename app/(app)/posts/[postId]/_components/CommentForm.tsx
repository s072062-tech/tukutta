// ルートコメントと返信で共用するバリデーション付きコメント入力フォームコンポーネント
"use client";

import type {
  CreateCommentRequest,
  CreateCommentResponse,
} from "@/app/api/posts/[postId]/comments/route";
import { Button } from "@/app/_components/common/Button";
import { TextArea } from "@/app/_components/common/TextArea";
import { useLoginGuard } from "@/app/_hooks/useLoginGuard";
import { ApiClientError, apiPost } from "@/lib/apiClient";
import { createCommentSchema } from "@/lib/validations/comment";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";

const commentBodySchema = createCommentSchema.pick({ body: true });
type CommentBodyValues = z.infer<typeof commentBodySchema>;

type CommentFormProps = {
  postId: number;
  parentCommentId?: number;
  placeholder: string;
  submitLabel: string;
  onCancel?: () => void;
  onSuccess?: () => void;
};

// コメント／返信の入力UI描画と送信処理
export function CommentForm({
  postId,
  parentCommentId,
  placeholder,
  submitLabel,
  onCancel,
  onSuccess,
}: CommentFormProps) {
  const router = useRouter();
  const { ensureLoggedIn } = useLoginGuard();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CommentBodyValues>({
    resolver: zodResolver(commentBodySchema) as Resolver<CommentBodyValues>,
    defaultValues: { body: "" },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  // 入力を検証したうえでAPIに投稿し、成功・エラーを処理
  const submitComment = handleSubmit(async (values) => {
    setFormError(null);
    const payload: CreateCommentRequest = {
      body: values.body,
      ...(parentCommentId != null ? { parentCommentId } : {}),
    };

    try {
      await apiPost<CreateCommentResponse>(
        `/api/posts/${postId}/comments`,
        payload,
      );
      reset({ body: "" });
      onSuccess?.();
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.status === 401) {
          router.push("/login");
          return;
        }
        if (error.status === 403 && error.code === "PROFILE_REQUIRED") {
          router.push("/signup?step=profile");
          return;
        }
        if (error.status === 422) {
          const bodyMessage = error.fieldErrors?.body?.[0];
          if (bodyMessage) {
            setError("body", { message: bodyMessage });
            return;
          }
          setFormError(error.message);
          return;
        }
      }
      setFormError("コメントできませんでした。時間をおいて再度お試しください。");
    }
  });

  // 未ログインでは検証も送信もしない
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!ensureLoggedIn()) {
      return;
    }
    void submitComment(event);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <TextArea
          id={`comment-body-${parentCommentId ?? "root"}`}
          aria-label={parentCommentId != null ? "返信" : "コメント"}
          placeholder={placeholder}
          hasError={Boolean(errors.body)}
          rows={3}
          {...register("body")}
        />
        {errors.body?.message ? (
          <p className="text-sm text-danger">{errors.body.message}</p>
        ) : null}
      </div>
      {formError ? <p className="text-sm text-danger">{formError}</p> : null}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
        {onCancel ? (
          <Button type="button" variant="ghost" onClick={onCancel}>
            キャンセル
          </Button>
        ) : null}
      </div>
    </form>
  );
}
