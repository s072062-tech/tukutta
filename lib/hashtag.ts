// ハッシュタグの抽出・正規化・DB 同期（投稿本文／プロジェクト概要）
import type { Prisma } from "@/app/generated/prisma/client";

/** `#` 直後のトークンに使える文字（Unicode の文字・数字と `_`） */
const HASHTAG_TOKEN_PATTERN = /^[\p{L}\p{N}_]+/u;

/** 直前がトークン文字なら `#` をタグ開始とみなさない */
function isTokenChar(ch: string | undefined): boolean {
  if (!ch) {
    return false;
  }
  return /[\p{L}\p{N}_]/u.test(ch);
}

/** 先頭の `#` を除き小文字化する。空なら "" */
export function normalizeHashtagName(raw: string): string {
  const withoutHash = raw.startsWith("#") ? raw.slice(1) : raw;
  return withoutHash.toLocaleLowerCase("en-US");
}

export type HashtagSegment =
  | { type: "text"; value: string }
  | { type: "tag"; value: string; name: string };

/** 表示用にテキストを通常部分とタグ部分に分割する */
export function parseHashtagSegments(text: string): HashtagSegment[] {
  const segments: HashtagSegment[] = [];
  let i = 0;
  let textStart = 0;

  const pushText = (end: number) => {
    if (end > textStart) {
      segments.push({ type: "text", value: text.slice(textStart, end) });
    }
  };

  while (i < text.length) {
    if (text[i] !== "#") {
      i += 1;
      continue;
    }

    const prev = i > 0 ? text[i - 1] : undefined;
    if (isTokenChar(prev)) {
      i += 1;
      continue;
    }

    const rest = text.slice(i + 1);
    const match = HASHTAG_TOKEN_PATTERN.exec(rest);
    if (!match) {
      i += 1;
      continue;
    }

    const rawToken = match[0];
    const name = normalizeHashtagName(rawToken);
    if (!name) {
      i += 1;
      continue;
    }

    pushText(i);
    const display = `#${rawToken}`;
    segments.push({ type: "tag", value: display, name });
    i += 1 + rawToken.length;
    textStart = i;
  }

  pushText(text.length);
  return segments;
}

/** テキストから正規化名の配列を返す（重複なし・出現順） */
export function extractHashtags(text: string): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const segment of parseHashtagSegments(text)) {
    if (segment.type === "tag" && !seen.has(segment.name)) {
      seen.add(segment.name);
      names.push(segment.name);
    }
  }
  return names;
}

/** trim 後に `#` で始まり、その後に1文字以上のトークンがあるか */
export function isHashtagQuery(q: string): boolean {
  return hashtagNameFromQuery(q) !== null;
}

/** isHashtagQuery が true なら正規化名。それ以外は null */
export function hashtagNameFromQuery(q: string): string | null {
  const trimmed = q.trim();
  if (!trimmed.startsWith("#")) {
    return null;
  }
  const rest = trimmed.slice(1);
  const match = HASHTAG_TOKEN_PATTERN.exec(rest);
  if (!match || match[0].length !== rest.length) {
    // クエリ全体が `#` + 1トークンであること（途中に空白などがあれば無効）
    if (!match) {
      return null;
    }
    // `#dev extra` のような場合は先頭トークンだけをタグ名として扱う（検索 URL は通常エンコード済み1語）
    return normalizeHashtagName(match[0]) || null;
  }
  return normalizeHashtagName(match[0]) || null;
}

async function syncHashtagLinks(
  tx: Prisma.TransactionClient,
  names: string[],
  existing: { id: number; hashtagId: number }[],
  createMany: (hashtagIds: number[]) => Promise<unknown>,
  deleteMany: (ids: number[]) => Promise<unknown>,
): Promise<void> {
  const wantedIds: number[] = [];
  for (const name of names) {
    const row = await tx.hashtag.upsert({
      where: { name },
      create: { name },
      update: {},
      select: { id: true },
    });
    wantedIds.push(row.id);
  }

  const wantedSet = new Set(wantedIds);
  const existingByHashtag = new Map(
    existing.map((row) => [row.hashtagId, row.id]),
  );

  const toDelete = existing
    .filter((row) => !wantedSet.has(row.hashtagId))
    .map((row) => row.id);
  if (toDelete.length > 0) {
    await deleteMany(toDelete);
  }

  const toCreate = wantedIds.filter((id) => !existingByHashtag.has(id));
  if (toCreate.length > 0) {
    await createMany(toCreate);
  }
}

/** 投稿本文から PostHashtag を再同期する */
export async function syncPostHashtags(
  tx: Prisma.TransactionClient,
  postId: number,
  body: string,
): Promise<void> {
  const names = extractHashtags(body);
  const existing = await tx.postHashtag.findMany({
    where: { postId },
    select: { id: true, hashtagId: true },
  });

  await syncHashtagLinks(
    tx,
    names,
    existing,
    (hashtagIds) =>
      tx.postHashtag.createMany({
        data: hashtagIds.map((hashtagId) => ({ postId, hashtagId })),
      }),
    (ids) => tx.postHashtag.deleteMany({ where: { id: { in: ids } } }),
  );
}

/** プロジェクト概要から ProjectHashtag を再同期する */
export async function syncProjectHashtags(
  tx: Prisma.TransactionClient,
  projectId: number,
  description: string | null,
): Promise<void> {
  const names = extractHashtags(description ?? "");
  const existing = await tx.projectHashtag.findMany({
    where: { projectId },
    select: { id: true, hashtagId: true },
  });

  await syncHashtagLinks(
    tx,
    names,
    existing,
    (hashtagIds) =>
      tx.projectHashtag.createMany({
        data: hashtagIds.map((hashtagId) => ({ projectId, hashtagId })),
      }),
    (ids) => tx.projectHashtag.deleteMany({ where: { id: { in: ids } } }),
  );
}
