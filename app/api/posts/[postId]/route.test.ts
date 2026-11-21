// GET/PATCH/DELETE /api/posts/[postId] の取得・更新・削除テスト
import { ApiError } from "@/lib/api/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getViewer = vi.fn();
const requireUser = vi.fn();
const findUnique = vi.fn();
const findUniqueOrThrow = vi.fn();
const updatePost = vi.fn();
const deletePost = vi.fn();
const findUniqueTask = vi.fn();
const updateTask = vi.fn();
const transaction = vi.fn();
const hashtagUpsert = vi.fn();
const postHashtagFindMany = vi.fn();
const postHashtagCreateMany = vi.fn();
const postHashtagDeleteMany = vi.fn();
const listPostStampSummaries = vi.fn();

vi.mock("@/lib/api/auth", () => ({
  getViewer: (...args: unknown[]) => getViewer(...args),
  requireUser: (...args: unknown[]) => requireUser(...args),
}));

vi.mock("@/lib/api/postStamp", () => ({
  listPostStampSummaries: (...args: unknown[]) => listPostStampSummaries(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    post: {
      findUnique: (...args: unknown[]) => findUnique(...args),
      findUniqueOrThrow: (...args: unknown[]) => findUniqueOrThrow(...args),
      update: (...args: unknown[]) => updatePost(...args),
      delete: (...args: unknown[]) => deletePost(...args),
    },
    task: {
      findUnique: (...args: unknown[]) => findUniqueTask(...args),
      update: (...args: unknown[]) => updateTask(...args),
    },
    $transaction: (...args: unknown[]) => transaction(...args),
  },
}));

function postCardRow(overrides: { id?: number; body?: string } = {}) {
  return {
    id: overrides.id ?? 10,
    body: overrides.body ?? "新しい本文",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    status: null,
    author: { id: 1, userId: "me", name: "自分" },
    task: null,
    _count: { comments: 0, favorites: 0 },
    favorites: [],
  };
}

function createTx() {
  return {
    task: {
      findUnique: findUniqueTask,
      update: updateTask,
    },
    post: { update: updatePost },
    hashtag: { upsert: hashtagUpsert },
    postHashtag: {
      findMany: postHashtagFindMany,
      createMany: postHashtagCreateMany,
      deleteMany: postHashtagDeleteMany,
    },
  };
}

describe("GET /api/posts/[postId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listPostStampSummaries.mockResolvedValue([]);
  });

  async function get(postId: string) {
    const { GET } = await import("./route");
    return GET(new Request(`http://localhost:3000/api/posts/${postId}`), {
      params: Promise.resolve({ postId }),
    });
  }

  it("不正な postId は 404 を返す", async () => {
    const response = await get("abc");
    expect(response.status).toBe(404);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("存在しない投稿は 404 を返す", async () => {
    getViewer.mockResolvedValue(null);
    findUnique.mockResolvedValue(null);
    const response = await get("999");
    expect(response.status).toBe(404);
  });

  it("著者でログインすると canEdit が true", async () => {
    getViewer.mockResolvedValue({ id: 1, userId: "me", name: "自分" });
    findUnique.mockResolvedValue({
      id: 10,
      body: "本文",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      status: null,
      author: { id: 1, userId: "me", name: "自分" },
      task: null,
      _count: { comments: 0, favorites: 0 },
      favorites: [],
    });
    listPostStampSummaries.mockResolvedValue([
      { emoji: "🎉", count: 2, sentByMe: true },
    ]);

    const response = await get("10");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      post: {
        id: 10,
        body: "本文",
        createdAt: "2026-01-01T00:00:00.000Z",
        author: { id: 1, userId: "me", name: "自分" },
        progress: null,
        commentCount: 0,
        favoriteCount: 0,
        isFavorited: false,
        canEdit: true,
        stamps: [{ emoji: "🎉", count: 2, sentByMe: true }],
      },
    });
  });

  it("未ログインでは canEdit が false", async () => {
    getViewer.mockResolvedValue(null);
    findUnique.mockResolvedValue({
      id: 10,
      body: "本文",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      status: null,
      author: { id: 1, userId: "me", name: "自分" },
      task: null,
      _count: { comments: 0, favorites: 0 },
      favorites: false,
    });

    const response = await get("10");
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.post.canEdit).toBe(false);
    expect(json.post.isFavorited).toBe(false);
  });
});

describe("PATCH /api/posts/[postId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireUser.mockResolvedValue({ id: 1, userId: "me", name: "自分" });
    transaction.mockImplementation(async (fn: (tx: ReturnType<typeof createTx>) => unknown) =>
      fn(createTx()),
    );
    postHashtagFindMany.mockResolvedValue([]);
    hashtagUpsert.mockResolvedValue({ id: 1, name: "tag" });
    postHashtagCreateMany.mockResolvedValue({ count: 0 });
    postHashtagDeleteMany.mockResolvedValue({ count: 0 });
    findUniqueOrThrow.mockResolvedValue(postCardRow());
  });

  async function patch(postId: string, body: unknown) {
    const { PATCH } = await import("./route");
    return PATCH(
      new Request(`http://localhost:3000/api/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
      { params: Promise.resolve({ postId }) },
    );
  }

  it("通常投稿は本文だけ更新でき、taskId を付けると 422", async () => {
    findUnique.mockResolvedValue({
      id: 10,
      authorId: 1,
      taskId: null,
      status: null,
    });
    updatePost.mockResolvedValue({ id: 10 });

    const ok = await patch("10", { body: "新しい本文" });
    expect(ok.status).toBe(200);
    expect(updatePost).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { body: "新しい本文" },
    });
    expect(updateTask).not.toHaveBeenCalled();

    findUnique.mockResolvedValue({
      id: 10,
      authorId: 1,
      taskId: null,
      status: null,
    });
    const bad = await patch("10", { body: "a", taskId: 2 });
    expect(bad.status).toBe(422);
    const json = await bad.json();
    expect(json.error.message).toBe("通常投稿を進捗投稿には変えられません。");
  });

  it("進捗投稿でステータスが同じなら Task を更新しない", async () => {
    findUnique.mockResolvedValue({
      id: 10,
      authorId: 1,
      taskId: 5,
      status: "進行中",
    });
    findUniqueTask.mockResolvedValue({
      id: 5,
      status: "進行中",
      projectId: 3,
      project: { ownerId: 1 },
    });
    updatePost.mockResolvedValue({ id: 10 });

    const response = await patch("10", {
      body: "進捗更新",
      projectId: 3,
      taskId: 5,
      status: "進行中",
    });
    expect(response.status).toBe(200);
    expect(updateTask).not.toHaveBeenCalled();
  });

  it("進捗投稿で別タスクへ変え、ステータス差分があるときだけ Task を更新する", async () => {
    findUnique.mockResolvedValue({
      id: 10,
      authorId: 1,
      taskId: 5,
      status: "進行中",
    });
    findUniqueTask.mockResolvedValue({
      id: 7,
      status: "未着手",
      projectId: 3,
      project: { ownerId: 1 },
    });
    updatePost.mockResolvedValue({ id: 10 });
    updateTask.mockResolvedValue({ id: 7 });

    const response = await patch("10", {
      body: "別タスク",
      projectId: 3,
      taskId: 7,
      status: "完了",
    });
    expect(response.status).toBe(200);
    expect(updatePost).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { body: "別タスク", taskId: 7, status: "完了" },
    });
    expect(updateTask).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { status: "完了" },
    });
  });

  it("進捗で taskId: null は 422、他人のタスクは 403、著者以外は 403", async () => {
    findUnique.mockResolvedValue({
      id: 10,
      authorId: 1,
      taskId: 5,
      status: "進行中",
    });
    const nullTask = await patch("10", { body: "a", taskId: null });
    expect(nullTask.status).toBe(422);

    findUnique.mockResolvedValue({
      id: 10,
      authorId: 1,
      taskId: 5,
      status: "進行中",
    });
    findUniqueTask.mockResolvedValue({
      id: 8,
      status: "未着手",
      projectId: 3,
      project: { ownerId: 99 },
    });
    const others = await patch("10", {
      body: "a",
      projectId: 3,
      taskId: 8,
      status: "進行中",
    });
    expect(others.status).toBe(403);

    findUnique.mockResolvedValue({
      id: 10,
      authorId: 2,
      taskId: null,
      status: null,
    });
    const forbiddenRes = await patch("10", { body: "a" });
    expect(forbiddenRes.status).toBe(403);
  });

  it("未ログインは 401、無い id は 404", async () => {
    requireUser.mockRejectedValue(
      new ApiError(401, "UNAUTHORIZED", "ログインしてください。"),
    );
    const unauthorized = await patch("10", { body: "a" });
    expect(unauthorized.status).toBe(401);

    requireUser.mockResolvedValue({ id: 1, userId: "me", name: "自分" });
    findUnique.mockResolvedValue(null);
    const missing = await patch("999", { body: "a" });
    expect(missing.status).toBe(404);
  });
});

describe("DELETE /api/posts/[postId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireUser.mockResolvedValue({ id: 1, userId: "me", name: "自分" });
  });

  async function del(postId: string) {
    const { DELETE } = await import("./route");
    return DELETE(new Request(`http://localhost:3000/api/posts/${postId}`, { method: "DELETE" }), {
      params: Promise.resolve({ postId }),
    });
  }

  it("著者の DELETE が 200 { id }", async () => {
    findUnique.mockResolvedValue({ id: 10, authorId: 1 });
    deletePost.mockResolvedValue({ id: 10 });
    const response = await del("10");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ id: 10 });
    expect(deletePost).toHaveBeenCalledWith({ where: { id: 10 } });
  });

  it("著者でない DELETE は 403", async () => {
    findUnique.mockResolvedValue({ id: 10, authorId: 2 });
    const response = await del("10");
    expect(response.status).toBe(403);
    expect(deletePost).not.toHaveBeenCalled();
  });

  it("未ログインは 401、無い id は 404", async () => {
    requireUser.mockRejectedValue(
      new ApiError(401, "UNAUTHORIZED", "ログインしてください。"),
    );
    expect((await del("10")).status).toBe(401);

    requireUser.mockResolvedValue({ id: 1, userId: "me", name: "自分" });
    findUnique.mockResolvedValue(null);
    expect((await del("999")).status).toBe(404);
  });
});
