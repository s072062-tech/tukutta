// 複数行テキスト入力の外観を設定する共通コンポーネント
"use client";

import { clsx } from "clsx";
import type { Ref, TextareaHTMLAttributes } from "react";

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  hasError?: boolean;
  ref?: Ref<HTMLTextAreaElement>;
};

export function TextArea({ hasError = false, className, ref, ...props }: TextAreaProps) {
  return (
    <textarea
      ref={ref}
      className={clsx(
        "w-full rounded-lg border bg-surface px-3 py-2 text-sm text-fg outline-none placeholder:text-fg-subtle focus:border-accent",
        hasError ? "border-danger" : "border-border",
        className,
      )}
      {...props}
    />
  );
}
