// 投稿・プロジェクト共通の絵文字スタンプバー（GitHub/Slack 型。API は親に委譲）
"use client";

import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import type { StampSummary } from "@/types/stamp";
import { clsx } from "clsx";
import { SmilePlus } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

type StampBarProps = {
  stamps: StampSummary[];
  onSend: (emoji: string) => Promise<void>;
  disabled?: boolean;
};

type EmojiSelectPayload = {
  native?: string;
};

// 件数付き絵文字チップと追加ボタン（emoji-mart）を表示する
export function StampBar({ stamps, onSend, disabled = false }: StampBarProps) {
  const [isSending, setIsSending] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const pickerRootRef = useRef<HTMLDivElement>(null);
  const pickerLabelId = useId();
  const controlsDisabled = disabled || isSending;

  useEffect(() => {
    if (!isPickerOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }
      if (pickerRootRef.current?.contains(target)) {
        return;
      }
      setIsPickerOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isPickerOpen]);

  async function handleSend(emoji: string) {
    if (controlsDisabled || !emoji) {
      return;
    }
    setIsSending(true);
    setIsPickerOpen(false);
    try {
      await onSend(emoji);
    } finally {
      setIsSending(false);
    }
  }

  function handleEmojiSelect(emoji: EmojiSelectPayload) {
    const native = emoji.native?.trim();
    if (!native) {
      return;
    }
    void handleSend(native);
  }

  return (
    <div className="relative flex flex-wrap items-center gap-2">
      {stamps.map((stamp) => {
        const sent = stamp.sentByMe;
        const buttonDisabled = controlsDisabled || sent;
        return (
          <button
            key={stamp.emoji}
            type="button"
            disabled={buttonDisabled}
            aria-label={`${stamp.emoji} ${stamp.count}`}
            onClick={() => void handleSend(stamp.emoji)}
            className={clsx(
              "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors",
              sent
                ? "border-[#0F6E6B] bg-[#E7F3F1] text-[#0F6E6B]"
                : "border-[#DEE7E9] bg-white text-[#1C2B2E] hover:border-[#C5D4D8]",
              buttonDisabled && !sent ? "cursor-not-allowed opacity-60" : null,
            )}
          >
            <span aria-hidden>{stamp.emoji}</span>
            <span className="text-xs text-[#6A7B82]">{stamp.count}</span>
          </button>
        );
      })}

      <div className="relative" ref={pickerRootRef}>
        <button
          type="button"
          disabled={controlsDisabled}
          aria-label="スタンプを追加"
          aria-expanded={isPickerOpen}
          aria-controls={isPickerOpen ? pickerLabelId : undefined}
          onClick={() => setIsPickerOpen((open) => !open)}
          className={clsx(
            "inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#DEE7E9] bg-white text-[#1C2B2E] transition-colors hover:border-[#C5D4D8]",
            controlsDisabled ? "cursor-not-allowed opacity-60" : null,
          )}
        >
          <SmilePlus className="h-4 w-4" aria-hidden />
        </button>

        {isPickerOpen ? (
          <div
            id={pickerLabelId}
            className="absolute top-full left-0 z-20 mt-2"
            role="dialog"
            aria-label="絵文字ピッカー"
          >
            <Picker
              data={data}
              onEmojiSelect={handleEmojiSelect}
              theme="light"
              previewPosition="none"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
