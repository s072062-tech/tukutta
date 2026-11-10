// 日時とユーザーハンドルの表示整形
import { format } from "date-fns";
import { ja } from "date-fns/locale";

export function formatShortDateTime(iso: string) {
  return format(new Date(iso), "M/d(E) H:mm", { locale: ja });
}

export function formatLongDateTime(iso: string) {
  return format(new Date(iso), "yyyy/M/d(E) H:mm", { locale: ja });
}

export function formatTime(iso: string) {
  return format(new Date(iso), "H:mm", { locale: ja });
}

export function formatHandle(userId: string) {
  return `@${userId}`;
}
