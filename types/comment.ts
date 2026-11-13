// コメントツリーの共通型
import type { UserSummary } from "@/types/user";

export type CommentNode = {
  id: number;
  body: string;
  createdAt: string;
  author: UserSummary;
  isFavorited: boolean;
  favoriteCount: number;
  canDelete: boolean;
  replies: CommentNode[];
};
