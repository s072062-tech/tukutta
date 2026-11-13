// セレクト入力の外観を設定する共通コンポーネント
"use client";

import { clsx } from "clsx";
import type { Ref, SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  hasError?: boolean;
  ref?: Ref<HTMLSelectElement>;
};

// 標準のselectにエラー時の赤枠表示と共通スタイルを適用して表示
export function Select({ hasError = false, className, ref, children, ...props }: SelectProps) {
  return (
    <select
      ref={ref}
      className={clsx(
        "h-11 w-full rounded-lg border bg-white px-3 text-sm text-[#1C2B2E] outline-none focus:border-[#0F6E6B] disabled:cursor-not-allowed disabled:bg-[#F3F6F7] disabled:text-[#8A9AA0]",
        hasError ? "border-[#B42318]" : "border-[#DEE7E9]",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
