// スタンプ送信ボディの zod 検証（投稿・プロジェクト共通）
import { EMOJI_MAX } from "@/lib/constants";
import { z } from "zod";

export const sendStampSchema = z.object({
  emoji: z
    .string()
    .trim()
    .min(1, "スタンプを選択してください。")
    .max(EMOJI_MAX, "スタンプを選択してください。"),
});

export type SendStampValues = z.output<typeof sendStampSchema>;
