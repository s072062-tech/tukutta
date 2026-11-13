// プロジェクト名検索欄（Enter で確定。検索ボタンは置かない）
"use client";

import { TextInput } from "@/app/_components/common/TextInput";
import { PROJECT_NAME_MAX } from "@/lib/constants";
import { Search } from "lucide-react";
import type { KeyboardEvent } from "react";

type ProjectSearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

// IME 変換中以外の Enter で onSubmit を呼ぶ
export function ProjectSearchInput({ value, onChange, onSubmit }: ProjectSearchInputProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const native = event.nativeEvent;
    const isComposing = native.isComposing || native.keyCode === 229;
    if (event.key !== "Enter" || isComposing) {
      return;
    }
    event.preventDefault();
    onSubmit();
  };

  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#8A9AA0]"
        aria-hidden
      />
      <TextInput
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="プロジェクト名で探す"
        maxLength={PROJECT_NAME_MAX}
        className="pl-10"
        aria-label="プロジェクト名で探す"
      />
    </div>
  );
}
