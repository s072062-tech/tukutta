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
        "w-full rounded-lg border bg-white px-3 py-2 text-sm text-[#1C2B2E] outline-none placeholder:text-[#8A9AA0] focus:border-[#0F6E6B]",
        hasError ? "border-[#B42318]" : "border-[#DEE7E9]",
        className,
      )}
      {...props}
    />
  );
}
