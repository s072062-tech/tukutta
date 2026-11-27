// 入力UIに装飾(ラベル・必須表示・ヒント・エラー文)を表示する、フォーム用の共通コンポーネント
"use client";

import type { ReactNode } from "react";

type FormFieldProps = {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  htmlFor?: string;
  children: ReactNode;
};

// ラベル付きの枠の中にchildren（入力UI）を置き、ヒントやエラーも表示する
export function FormField({ label, required = false, hint, error, htmlFor, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <label htmlFor={htmlFor} className="text-sm font-medium text-fg">
          {label}
        </label>
        {required ? (
          <span className="rounded bg-danger-soft px-1.5 py-0.5 text-xs font-medium text-danger">
            必須
          </span>
        ) : null}
      </div>
      {children}
      {hint ? <p className="text-xs text-fg-muted">{hint}</p> : null}
      {error ? (
        <p id={htmlFor ? `${htmlFor}-error` : undefined} className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
