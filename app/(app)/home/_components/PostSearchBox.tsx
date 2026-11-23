// ホーム右カラムの投稿本文検索カードコンポーネント
"use client";

import { TextInput } from "@/app/_components/common/TextInput";
import { Search } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

type PostSearchBoxProps = {
  query: string;
  onSearch: (q: string | null) => void;
};

// Enterで検索語を確定する。入力のたびには検索しない
export function PostSearchBox({ query, onSearch }: PostSearchBoxProps) {
  const [value, setValue] = useState(query);

  useEffect(() => {
    setValue(query);
  }, [query]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = value.trim();
    onSearch(trimmed ? trimmed : null);
  };

  return (
    <aside className="rounded-2xl border border-[#DEE7E9] bg-white p-5 shadow-sm">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#8A9AA0]"
            aria-hidden
          />
          <TextInput
            type="search"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="検索"
            className="pl-10"
            aria-label="検索"
          />
        </div>
      </form>
      <p className="mt-3 text-sm leading-relaxed text-[#6A7B82]">
        本文の部分一致、ハッシュタグの一致で検索します。結果は新しい順に表示されます（お気に入りタブはお気に入りした順）。
      </p>
      <p className="mt-2 text-sm leading-relaxed text-[#6A7B82]">
        閲覧・検索はログインなしでも利用できます。
      </p>
    </aside>
  );
}
