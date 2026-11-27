// 本文・概要内のハッシュタグを検索リンクとして表示するコンポーネント
"use client";

import { parseHashtagSegments } from "@/lib/hashtag";
import { clsx } from "clsx";
import Link from "next/link";

type HashtagTextProps = {
  text: string;
  linkTo: "posts" | "projects";
  className?: string;
};

// 正規化名から検索URLを作る
function hashtagHref(linkTo: "posts" | "projects", name: string) {
  const q = encodeURIComponent(`#${name}`);
  return linkTo === "posts" ? `/home?q=${q}` : `/projects?q=${q}`;
}

// テキストをパースしタグ部分だけLinkにする
export function HashtagText({ text, linkTo, className }: HashtagTextProps) {
  const segments = parseHashtagSegments(text);

  return (
    <span className={clsx("whitespace-pre-wrap", className)}>
      {segments.map((segment, index) => {
        if (segment.type === "text") {
          return <span key={`t-${index}`}>{segment.value}</span>;
        }
        return (
          <Link
            key={`h-${index}-${segment.name}`}
            href={hashtagHref(linkTo, segment.name)}
            onClick={(event) => event.stopPropagation()}
            className="text-accent-fg hover:underline"
          >
            {segment.value}
          </Link>
        );
      })}
    </span>
  );
}
