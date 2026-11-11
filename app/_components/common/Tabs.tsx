// 下線で選択表示のタブ共通コンポーネント
"use client";

import { clsx } from "clsx";

type TabItem = {
  key: string;
  label: string;
};

type TabsProps = {
  items: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
};

export function Tabs({ items, activeKey, onChange }: TabsProps) {
  return (
    <div className="flex gap-6 border-b border-[#DEE7E9]" role="tablist">
      {items.map((item) => {
        const active = item.key === activeKey;
        return (
          // itemsを横並びのボタンでタブ表示、activeでタブ選択状態を設定
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={active}
            className={clsx(
              "relative -mb-px pb-3 text-sm font-medium transition-colors",
              active ? "text-[#0F6E6B]" : "text-[#6A7B82] hover:text-[#1C2B2E]",
            )}
            onClick={() => onChange(item.key)}
          >
            {item.label}
            {active ? (
              <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-[#0F6E6B]" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
