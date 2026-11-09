// 全画面で共通のボタンコンポーネント
"use client";

import { clsx } from "clsx";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

// ボタンの見た目、 緑背景のメインボタン, 枠線付きの白ボタン, 背景なし控えめのボタン
type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  isLoading?: boolean;
  icon?: ReactNode;
};

const variantClassName: Record<ButtonVariant, string> = {
  primary: "bg-[#0F6E6B] text-white hover:bg-[#0C5C59]",
  secondary: "border border-[#DEE7E9] bg-white text-[#1C2B2E] hover:bg-[#F3F6F7]",
  ghost: "text-[#0F6E6B] hover:bg-[#E7F3F1]",
};

// ボタン種類とクラス名から、ボタン用のTailwind文字列を組み立て
export function buttonClassName(variant: ButtonVariant, className?: string) {
  return clsx(
    "inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
    variantClassName[variant],
    className,
  );
}

// ボタンの表示、読み込み中ならスピナー表示と無効化する
export function Button({
  variant = "primary",
  isLoading = false,
  icon,
  className,
  disabled,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClassName(variant, className)}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
}
