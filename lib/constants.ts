// 全体で共通の定数定義

// タスクの状態ラベル
export const TASK_STATUSES = ["未着手", "進行中", "完了"] as const;

// ユーザー名の最大文字数
export const USER_NAME_MAX = 30;

// ユーザーIDの許容文字・長さを表す正規表現（半角英数字・_・- の 3〜20 文字）
export const USER_HANDLE_PATTERN = /^[A-Za-z0-9_-]{3,20}$/;

// 投稿本文の最大文字数
export const POST_BODY_MAX = 140;

// コメント本文の最大文字数
export const COMMENT_BODY_MAX = 140;

// プロジェクト名の最大文字数
export const PROJECT_NAME_MAX = 30;

// プロジェクト説明の最大文字数
export const PROJECT_DESCRIPTION_MAX = 300;

// タスク名の最大文字数
export const TASK_NAME_MAX = 30;

// 一覧の1ページあたり件数
export const PAGE_SIZE = 20;
