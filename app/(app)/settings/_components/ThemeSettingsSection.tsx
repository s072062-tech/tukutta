// アプリ設定のテーマ（ライト／ダーク／システム）切替
"use client";

import { SegmentedControl } from "@/app/_components/common/SegmentedControl";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const THEME_ITEMS = [
  { key: "light", label: "ライト" },
  { key: "dark", label: "ダーク" },
  { key: "system", label: "システム設定" },
] as const;

type ThemeKey = (typeof THEME_ITEMS)[number]["key"];

function isThemeKey(value: string): value is ThemeKey {
  return THEME_ITEMS.some((item) => item.key === value);
}

export function ThemeSettingsSection() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeKey: ThemeKey =
    mounted && theme && isThemeKey(theme) ? theme : "system";

  return (
    <section className="w-full rounded-2xl border border-border bg-surface px-8 py-10 sm:px-10">
      <h2 className="text-lg font-bold text-fg">テーマ</h2>
      <p className="mt-2 text-sm text-fg-muted">
        見た目の明るさを選びます。選択はこの端末にだけ保存されます。
      </p>
      <div className="mt-6">
        {mounted ? (
          <SegmentedControl
            items={[...THEME_ITEMS]}
            activeKey={activeKey}
            onChange={(key) => {
              if (isThemeKey(key)) {
                setTheme(key);
              }
            }}
          />
        ) : (
          <div className="h-10 w-full max-w-md animate-pulse rounded-full bg-surface-muted" />
        )}
      </div>
    </section>
  );
}
