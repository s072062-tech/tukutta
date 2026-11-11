// 投稿の共通型定義
import type { TaskStatus } from "@/types/task";
import type { UserSummary } from "@/types/user";

export type PostProgress = {
  taskId: number;
  taskName: string;
  status: TaskStatus;
  project: { id: number; name: string };
};

export type PostCard = {
  id: number;
  body: string;
  createdAt: string;
  author: UserSummary;
  progress: PostProgress | null;
  commentCount: number;
  favoriteCount: number;
  isFavorited: boolean;
};
