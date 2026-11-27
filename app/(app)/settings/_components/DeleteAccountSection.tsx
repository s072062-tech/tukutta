// アプリ設定のアカウント削除カード
"use client";

import { Button } from "@/app/_components/common/Button";
import { ConfirmDialog } from "@/app/_components/common/ConfirmDialog";
import { useAuth } from "@/app/_hooks/useAuth";
import type { DeleteMeResponse } from "@/app/api/user-self/route";
import { ApiClientError, apiDelete } from "@/lib/apiClient";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const DELETE_ERROR_MESSAGE =
  "アカウントを削除できませんでした。時間をおいて再度お試しください。";

export function DeleteAccountSection() {
  const router = useRouter();
  const { mutate } = useAuth();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setError(null);
    setIsDeleting(true);
    try {
      await apiDelete<DeleteMeResponse>("/api/user-self");
      const supabase = createClient();
      await supabase.auth.signOut();
      await mutate();
      window.location.assign("/");
    } catch (err) {
      setOpen(false);
      if (err instanceof ApiClientError && (err.status === 401 || err.status === 403)) {
        await mutate();
        if (err.status === 401) {
          router.replace("/login");
        } else {
          router.replace("/signup?step=profile");
        }
        return;
      }
      setError(DELETE_ERROR_MESSAGE);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="w-full rounded-2xl border border-border bg-surface px-8 py-10 sm:px-10">
      <h2 className="text-lg font-bold text-fg">アカウント削除</h2>
      <p className="mt-2 text-sm text-fg-muted">
        アカウントを削除すると、投稿・プロジェクト・コメントなど、あなたのデータはすべて削除され、元に戻せません。
      </p>
      <div className="mt-6 flex flex-col gap-2">
        <Button
          type="button"
          variant="secondary"
          className="w-full border-danger-border text-danger hover:bg-danger-soft"
          onClick={() => {
            setError(null);
            setOpen(true);
          }}
        >
          アカウントを削除する
        </Button>
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}
      </div>

      <ConfirmDialog
        open={open}
        title="アカウントを削除しますか？"
        message="投稿・プロジェクト・コメントなど、あなたのデータはすべて削除され、元に戻せません。"
        confirmLabel="削除する"
        isLoading={isDeleting}
        onConfirm={() => {
          void handleConfirm();
        }}
        onCancel={() => {
          if (!isDeleting) {
            setOpen(false);
          }
        }}
      />
    </section>
  );
}
