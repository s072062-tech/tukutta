"use client";

import "./globals.css";
import type { ReactNode } from "react";

type LayoutProps = {
  children: ReactNode,
  className?: string,
};

export default function RootLayout({ children }: LayoutProps) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-gray-50 antialiased">
        <main>{children}</main>
      </body>
    </html>
  );
}
