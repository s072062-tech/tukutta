// テキスト入力の外観を設定する共通コンポーネント
"use client";

import { clsx } from "clsx";
import type { InputHTMLAttributes, Ref } from "react";

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  hasError?: boolean;
  ref?: Ref<HTMLInputElement>;
};

// 標準のinputにエラー時の赤枠表示と共通スタイルを適用して表示
export function TextInput({ hasError = false, className, ref, ...props }: TextInputProps) {
  return (
    <input
      ref={ref}
      className={clsx(
        "h-11 w-full rounded-lg border bg-white px-3 text-sm text-[#1C2B2E] outline-none placeholder:text-[#8A9AA0] focus:border-[#0F6E6B]",
        hasError ? "border-[#B42318]" : "border-[#DEE7E9]",
        className,
      )}
      {...props}
    />
  );
}
