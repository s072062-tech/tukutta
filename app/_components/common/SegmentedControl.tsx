// 角丸の2択切替（投稿の通常／進捗など）共通コンポーネント
"use client";

import { clsx } from "clsx";

type SegmentedItem = {
  key: string;
  label: string;
};

type SegmentedControlProps = {
  items: SegmentedItem[];
  activeKey: string;
  onChange: (key: string) => void;
};

// itemsを横並びのセグメントボタンで表示し、activeKeyで選択状態を切り替える
export function SegmentedControl({ items, activeKey, onChange }: SegmentedControlProps) {
  return (
    <div
      className="inline-flex rounded-full border border-border bg-surface-muted p-1"
      role="group"
    >
      {items.map((item) => {
        const active = item.key === activeKey;
        return (
          <button
            key={item.key}
            type="button"
            aria-pressed={active}
            className={clsx(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-surface text-accent-fg shadow-sm"
                : "text-fg-muted hover:text-fg",
            )}
            onClick={() => onChange(item.key)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
