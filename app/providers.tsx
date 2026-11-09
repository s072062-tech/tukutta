// アプリ全体の共通設定
"use client";

import { apiGet } from "@/lib/apiClient";
import type { ReactNode } from "react";
import { SWRConfig } from "swr";

type ProvidersProps = {
  children: ReactNode;
};

// 子要素に共通の設定を適用する
export function Providers({ children }: ProvidersProps) {
  // SWRに共通取得処理のapiGetを設定
  return <SWRConfig value={{ fetcher: apiGet }}>{children}</SWRConfig>;
}
