// ユーザー認証の情報を表示する、サインイン,ログイン共通のカード枠コンポーネント
"use client";

import type { ReactNode } from "react";

// カードに表示する情報
type AuthCardProps = {
  header?: ReactNode;
  title: string;
  badge?: ReactNode;
  description?: string;
  alert?: string | null;
  children: ReactNode;
  footer?: ReactNode;
};

// 渡された情報を共通のカード枠の中に表示する
export function AuthCard({ header, title, badge, description, alert, children, footer }: AuthCardProps) {
  return (
    <section className="mx-auto w-full max-w-[480px] rounded-2xl border border-[#DEE7E9] bg-white px-8 py-10 sm:px-10">
      {header}
      <div className={`flex items-start justify-between gap-3 ${header ? "mt-6" : ""}`}>
        <h1 className="text-2xl font-bold text-[#1C2B2E]">{title}</h1>
        {badge}
      </div>
      {description ? <p className="mt-3 text-sm leading-6 text-[#5C6B70]">{description}</p> : null}
      {alert ? (
        <p role="alert" className="mt-4 text-sm text-[#B42318]">
          {alert}
        </p>
      ) : null}
      <div className="mt-6">{children}</div>
      {footer ? <div className="mt-6 text-center text-sm">{footer}</div> : null}
    </section>
  );
}
