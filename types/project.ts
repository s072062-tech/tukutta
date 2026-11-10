// プロジェクトの共通型定義
import type { UserSummary } from "@/types/user";

export type ProjectCard = {
  id: number;
  name: string;
  description: string | null;
  owner: UserSummary;
  taskCounts: { total: number; 未着手: number; 進行中: number; 完了: number };
};
