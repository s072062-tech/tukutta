// アプリ全体の共通設定（SWR・テーマ）
"use client";

import { THEME_STORAGE_KEY } from "@/lib/constants";
import { apiGet } from "@/lib/apiClient";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { SWRConfig } from "swr";

type ProvidersProps = {
  children: ReactNode;
};

// 子要素に共通の設定を適用する
export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey={THEME_STORAGE_KEY}
    >
      <SWRConfig value={{ fetcher: apiGet }}>{children}</SWRConfig>
    </ThemeProvider>
  );
}
