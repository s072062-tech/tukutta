// プロジェクト歩みカレンダー（月曜始まり・薄緑の投稿日）
"use client";

import type { GetProjectJourneyResponse } from "@/app/api/projects/[projectId]/journey/route";
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  startOfMonth,
} from "date-fns";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

type JourneyCalendarProps = {
  year: number;
  month: number;
  days: GetProjectJourneyResponse["days"];
  onPrev: () => void;
  onNext: () => void;
};

const WEEKDAYS = ["月", "火", "水", "木", "金", "土", "日"] as const;

export function JourneyCalendar({
  year,
  month,
  days,
  onPrev,
  onNext,
}: JourneyCalendarProps) {
  const monthStart = startOfMonth(new Date(year, month - 1, 1));
  const monthEnd = endOfMonth(monthStart);
  const dates = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const leadingEmpty = (getDay(monthStart) + 6) % 7;
  const postsByDate = new Map(days.map((day) => [day.date, day.posts]));

  return (
    <section className="rounded-2xl border border-border bg-surface p-4">
      {/* ヘッダー、年月表示と前後月ボタン */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label="前の月"
          onClick={onPrev}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-fg hover:bg-surface-muted"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>
        <h2 className="text-sm font-semibold text-fg">
          {year}年{month}月
        </h2>
        <button
          type="button"
          aria-label="次の月"
          onClick={onNext}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-fg hover:bg-surface-muted"
        >
          <ChevronRight className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <p className="mt-3 text-xs text-fg-muted">
        進捗投稿した日が残ります。日付上のタスクから、その投稿の詳細へ。
      </p>

      {/* グリッド、月曜始まり。月初・月末の空きマスを埋めて 7 列に揃える */}
      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs text-fg-muted">
        {WEEKDAYS.map((label) => (
          <div
            key={label}
            className={`py-1 font-medium ${ label === "土" ? "text-[#2563EB]" : label === "日" ? "text-[#DC2626]" : "" }`} // 土日色はカレンダー固有（テーマトークン外）
          >
            {label}
          </div>
        ))}
      </div>

      {/* 投稿日。その日に進捗投稿があれば薄緑背景にし、タスク名・時刻のリンクを並べる */}
      <div className="mt-1 grid grid-cols-7 gap-1">
        {Array.from({ length: leadingEmpty }, (_, index) => (
          <div
            key={`empty-start-${index}`}
            className="min-h-16 rounded-lg bg-surface-muted"
            aria-hidden
          />
        ))}
        {dates.map((date) => {
          const key = format(date, "yyyy-MM-dd");
          const posts = postsByDate.get(key) ?? [];
          const hasPosts = posts.length > 0;
          return (
            <div
              key={key}
              className={
                hasPosts
                  ? "min-h-16 rounded-lg bg-accent-soft p-1.5 text-left"
                  : "min-h-16 rounded-lg p-1.5 text-left"
              }
            >
              <p className="text-xs font-medium text-fg">{format(date, "d")}</p>
              {hasPosts ? (
                <ul className="mt-1 flex flex-col gap-1">
                  {posts.map((post) => (
                    <li key={post.postId}>
                      <Link
                        href={`/posts/${post.postId}`}
                        className="flex items-center gap-0.5 truncate text-[10px] text-accent-fg hover:underline"
                      >
                        <span className="truncate">{post.taskName}</span>
                        <ArrowUpRight className="h-3 w-3 shrink-0" aria-hidden />
                        <span className="shrink-0 text-fg-muted">{post.time}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          );
        })}
        {(() => {
          const trailing = (7 - ((leadingEmpty + dates.length) % 7)) % 7;
          return Array.from({ length: trailing }, (_, index) => (
            <div
              key={`empty-end-${index}`}
              className="min-h-16 rounded-lg bg-surface-muted"
              aria-hidden
            />
          ));
        })()}
      </div>
    </section>
  );
}
