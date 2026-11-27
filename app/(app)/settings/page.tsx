// 設定画面（/settings）
"use client";

import { DeleteAccountSection } from "@/app/(app)/settings/_components/DeleteAccountSection";
import { LogoutButton } from "@/app/(app)/settings/_components/LogoutButton";
import { MutedUsersSection } from "@/app/(app)/settings/_components/MutedUsersSection";
import { ProfileSettingsForm } from "@/app/(app)/settings/_components/ProfileSettingsForm";
import { ThemeSettingsSection } from "@/app/(app)/settings/_components/ThemeSettingsSection";
import { LoadingState } from "@/app/_components/common/LoadingState";
import { useRequireAuth } from "@/app/_hooks/useRequireAuth";

export default function SettingsPage() {
  const { isReady, me } = useRequireAuth();

  if (!isReady || !me) {
    return <LoadingState variant="page" />;
  }

  return (
    <div className="mx-auto flex w-full max-w-[480px] flex-col gap-6 px-4 py-8 sm:px-0">
      <h1 className="text-2xl font-bold text-fg">アプリ設定</h1>

      <section className="w-full rounded-2xl border border-border bg-surface px-8 py-10 sm:px-10">
        <div className="flex flex-col gap-6">
          <ProfileSettingsForm me={me} />
          <LogoutButton />
        </div>
      </section>

      <ThemeSettingsSection />
      <MutedUsersSection />
      <DeleteAccountSection />
    </div>
  );
}
