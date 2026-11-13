// 削除など破壊操作の確認ダイアログ（native dialog）
"use client";

import { useEffect, useRef } from "react";
import { Button } from "./Button";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
};

// openに合わせてdialogを開閉し、確認中は確認ボタンだけloadingにする
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (open) {
      if (!dialog.open) {
        // jsdom は showModal 未実装のため、属性フォールバックを使う
        if (typeof dialog.showModal === "function") {
          dialog.showModal();
        } else {
          dialog.setAttribute("open", "");
        }
      }
    } else if (dialog.open) {
      if (typeof dialog.close === "function") {
        dialog.close();
      } else {
        dialog.removeAttribute("open");
      }
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 m-auto w-[min(100%-2rem,24rem)] rounded-2xl border border-[#DEE7E9] bg-white p-6 text-[#1C2B2E] shadow-lg backdrop:bg-black/40"
      onCancel={(event) => {
        event.preventDefault();
        if (!isLoading) {
          onCancel();
        }
      }}
      onClose={() => {
        if (open) {
          onCancel();
        }
      }}
    >
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-2 text-sm whitespace-pre-wrap text-[#6A7B82]">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          キャンセル
        </Button>
        <Button type="button" variant="primary" isLoading={isLoading} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
