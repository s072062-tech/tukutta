// アプリ設定のミュート一覧カード
"use client";

import { MutedUserRow } from "@/app/(app)/settings/_components/MutedUserRow";
import { useMutedUsers } from "@/app/(app)/settings/_hooks/useMutedUsers";
import { EmptyState } from "@/app/_components/common/EmptyState";
import { ErrorMessage } from "@/app/_components/common/ErrorMessage";
import { LoadMoreButton } from "@/app/_components/common/LoadMoreButton";
import { LoadingState } from "@/app/_components/common/LoadingState";

export function MutedUsersSection() {
  const {
    users,
    hasMore,
    isLoading,
    isLoadingMore,
    loadMore,
    error,
    mutate,
  } = useMutedUsers();

  return (
    <section className="w-full rounded-2xl border border-border bg-surface px-8 py-10 sm:px-10">
      <h2 className="text-lg font-bold text-fg">ミュート一覧</h2>
      <p className="mt-2 text-sm text-fg-muted">
        ミュート中のユーザーです。解除するとホームなどに投稿が再び表示されます。
      </p>

      <div className="mt-6">
        {error ? (
          <ErrorMessage
            message={error.message}
            onRetry={() => {
              void mutate();
            }}
          />
        ) : null}

        {!error && isLoading ? <LoadingState variant="list" /> : null}

        {!error && !isLoading && users.length === 0 ? (
          <EmptyState message="ミュート中のユーザーはいません" />
        ) : null}

        {!error && !isLoading && users.length > 0 ? (
          <div className="-mx-2 overflow-hidden rounded-xl border border-border">
            <ul className="divide-y divide-border">
              {users.map((user) => (
                <li key={user.id}>
                  <MutedUserRow
                    user={user}
                    onUnmute={() => {
                      void mutate();
                    }}
                  />
                </li>
              ))}
            </ul>
            <div className="border-t border-border px-4 py-3">
              <LoadMoreButton
                hasMore={hasMore}
                isLoading={isLoadingMore}
                onClick={loadMore}
              />
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
