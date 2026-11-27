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
        "h-11 w-full rounded-lg border bg-surface px-3 text-sm text-fg outline-none focus:border-accent disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-fg-subtle",
        hasError ? "border-danger" : "border-border",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
