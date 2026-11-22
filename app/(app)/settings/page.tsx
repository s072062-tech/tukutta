// 設定画面（/settings）
"use client";

import { LogoutButton } from "@/app/(app)/settings/_components/LogoutButton";
import { ProfileSettingsForm } from "@/app/(app)/settings/_components/ProfileSettingsForm";
import { LoadingState } from "@/app/_components/common/LoadingState";
import { useRequireAuth } from "@/app/_hooks/useRequireAuth";

export default function SettingsPage() {
  const { isReady, me } = useRequireAuth();

  if (!isReady || !me) {
    return <LoadingState variant="page" />;
  }

  return (
    <div className="mx-auto w-full max-w-[480px] px-4 py-8 sm:px-0">
      <h1 className="text-2xl font-bold text-[#1C2B2E]">アプリ設定</h1>
      <section className="mt-6 w-full rounded-2xl border border-[#DEE7E9] bg-white px-8 py-10 sm:px-10">
        <div className="flex flex-col gap-6">
          <ProfileSettingsForm me={me} />
          <LogoutButton />
        </div>
      </section>
    </div>
  );
}
