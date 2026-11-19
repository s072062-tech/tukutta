// GET/POST /api/posts のタブ・認証・作成テスト
import { ApiError } from "@/lib/api/errors";
import { PAGE_SIZE } from "@/lib/constants";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getViewer = vi.fn();
const requireUser = vi.fn();
const findManyPosts = vi.fn();
const findManyFollows = vi.fn();
const createPost = vi.fn();
const findUniqueOrThrow = vi.fn();
const findUniqueTask = vi.fn();
const updateTask = vi.fn();
const transaction = vi.fn();
const hashtagUpsert = vi.fn();
const postHashtagFindMany = vi.fn();
const postHashtagCreateMany = vi.fn();
const postHashtagDeleteMany = vi.fn();

vi.mock("@/lib/api/auth", () => ({
  getViewer: (...args: unknown[]) => getViewer(...args),
  requireUser: (...args: unknown[]) => requireUser(...args),
}));

vi.mock("@/lib/api/postCard", () => ({
  postCardSelect: () => ({}),
  toPostCard: (row: { id: number }) => ({
    id: row.id,
    body: "body",
    createdAt: "2026-01-01T00:00:00.000Z",
    author: { id: 1, userId: "me", name: "自分", avatarUrl: null },
    progress: null,
    commentCount: 0,
    favoriteCount: 0,
    isFavorited: false,
  }),
}));

vi.mock("@/lib/api/mute", () => ({
  excludeMutedAuthors: () => ({}),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    post: {
      findMany: (...args: unknown[]) => findManyPosts(...args),
      create: (...args: unknown[]) => createPost(...args),
      findUniqueOrThrow: (...args: unknown[]) => findUniqueOrThrow(...args),
    },
    userFollow: {
      findMany: (...args: unknown[]) => findManyFollows(...args),
    },
    task: {
      findUnique: (...args: unknown[]) => findUniqueTask(...args),
      update: (...args: unknown[]) => updateTask(...args),
    },
    $transaction: (...args: unknown[]) => transaction(...args),
  },
}));

// syncPostHashtags が触る tx のモックを返す
function createTx() {
  return {
    task: {
      findUnique: findUniqueTask,
      update: updateTask,
    },
    post: { create: createPost },
    hashtag: { upsert: hashtagUpsert },
    postHashtag: {
      findMany: postHashtagFindMany,
      createMany: postHashtagCreateMany,
      deleteMany: postHashtagDeleteMany,
    },
  };
}

describe("GET /api/posts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getViewer.mockResolvedValue(null);
  });

  async function get(query = "") {
    const { GET } = await import("./route");
    const url = `http://localhost:3000/api/posts${query ? `?${query}` : ""}`;
    return GET(new Request(url), { params: Promise.resolve({}) });
  }

  it("不正な tab は 422 を返す", async () => {
    const response = await get("tab=nope");
    expect(response.status).toBe(422);
    expect(findManyPosts).not.toHaveBeenCalled();
  });

  it("following で未ログインなら 401", async () => {
    requireUser.mockRejectedValue(
      new ApiError(401, "UNAUTHORIZED", "ログインしてください。"),
    );
    const response = await get("tab=following");
    expect(response.status).toBe(401);
  });

  it("フォロー先が0件なら空配列を返す", async () => {
    requireUser.mockResolvedValue({ id: 1, userId: "me", name: "自分" });
    findManyFollows.mockResolvedValue([]);
    const response = await get("tab=following");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ items: [], nextCursor: null });
    expect(findManyPosts).not.toHaveBeenCalled();
  });

  it("progress タブは taskId not null で絞る", async () => {
    findManyPosts.mockResolvedValue([]);
    const response = await get("tab=progress");
    expect(response.status).toBe(200);
    expect(findManyPosts).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          AND: expect.arrayContaining([{ taskId: { not: null } }]),
        },
      }),
    );
  });

  it("PAGE_SIZE+1 件なら nextCursor を返す", async () => {
    const rows = Array.from({ length: PAGE_SIZE + 1 }, (_, i) => ({
      id: i + 1,
    }));
    findManyPosts.mockResolvedValue(rows);
    const response = await get();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.items).toHaveLength(PAGE_SIZE);
    expect(body.nextCursor).toBe(PAGE_SIZE);
  });
});

describe("POST /api/posts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireUser.mockResolvedValue({ id: 1, userId: "me", name: "自分" });
    findUniqueOrThrow.mockResolvedValue({ id: 99 });
    hashtagUpsert.mockResolvedValue({ id: 1 });
    postHashtagFindMany.mockResolvedValue([]);
    postHashtagCreateMany.mockResolvedValue({ count: 0 });
    postHashtagDeleteMany.mockResolvedValue({ count: 0 });
    transaction.mockImplementation(
      async (fn: (tx: ReturnType<typeof createTx>) => Promise<number>) =>
        fn(createTx()),
    );
  });

  async function post(body: unknown) {
    const { POST } = await import("./route");
    return POST(
      new Request("http://localhost:3000/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
      { params: Promise.resolve({}) },
    );
  }

  it("未ログインなら 401", async () => {
    requireUser.mockRejectedValue(
      new ApiError(401, "UNAUTHORIZED", "ログインしてください。"),
    );
    const response = await post({ kind: "normal", body: "hello" });
    expect(response.status).toBe(401);
  });

  it("通常投稿を作成して 201 を返す", async () => {
    createPost.mockResolvedValue({ id: 99 });
    const response = await post({ kind: "normal", body: "hello" });
    expect(response.status).toBe(201);
    expect(createPost).toHaveBeenCalledWith({
      data: { authorId: 1, body: "hello", taskId: null, status: null },
      select: { id: true },
    });
    await expect(response.json()).resolves.toMatchObject({
      post: { id: 99 },
    });
  });

  it("他人のタスクは 403", async () => {
    findUniqueTask.mockResolvedValue({
      id: 2,
      status: "未着手",
      projectId: 10,
      project: { ownerId: 999 },
    });

    const response = await post({
      kind: "progress",
      body: "一歩",
      projectId: 10,
      taskId: 2,
      status: "進行中",
    });
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error.message).toBe(
      "自分が登録したプロジェクトのタスクを選んでください。",
    );
  });

  it("projectId 不一致は 422", async () => {
    findUniqueTask.mockResolvedValue({
      id: 2,
      status: "未着手",
      projectId: 10,
      project: { ownerId: 1 },
    });

    const response = await post({
      kind: "progress",
      body: "一歩",
      projectId: 99,
      taskId: 2,
      status: "進行中",
    });
    expect(response.status).toBe(422);
    const body = await response.json();
    expect(body.error.fieldErrors?.taskId?.[0]).toBe(
      "選択したタスクは、選択したプロジェクトのタスクではありません。",
    );
  });

  it("進捗でステータスが同じなら task.update しない", async () => {
    createPost.mockResolvedValue({ id: 99 });
    findUniqueTask.mockResolvedValue({
      id: 2,
      status: "進行中",
      projectId: 10,
      project: { ownerId: 1 },
    });

    const response = await post({
      kind: "progress",
      body: "一歩",
      projectId: 10,
      taskId: 2,
      status: "進行中",
    });
    expect(response.status).toBe(201);
    expect(updateTask).not.toHaveBeenCalled();
  });
});
