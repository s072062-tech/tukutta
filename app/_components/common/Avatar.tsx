// ユーザー名の頭文字で円形のアイコンを表示し、ユーザー情報へリンクするコンポーネント
"use client";

import Link from "next/link";

const AVATAR_COLORS = ["#0F6E6B", "#1D4E89", "#B85C38", "#6B4C9A", "#3D6B4F", "#8C4A4A"];

const sizeClassName = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
} as const;

type AvatarProps = {
  name: string;
  id: number;
  userId: string;
  size: "sm" | "md" | "lg";
};

export function Avatar({ name, id, userId, size }: AvatarProps) {
  const color = AVATAR_COLORS[Math.abs(id) % AVATAR_COLORS.length];
  const initial = Array.from(name)[0] ?? "?";

  return (
    <Link
      href={`/users/${userId}`}
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-medium text-white ${sizeClassName[size]}`}
      style={{ backgroundColor: color }}
      aria-label={`${name}のユーザー情報`}
    >
      <span aria-hidden>{initial}</span>
    </Link>
  );
}
