// GET/PATCH/DELETE /api/projects/[projectId]/tasks/[taskId] のテスト
import { ApiError } from "@/lib/api/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUser = vi.fn();
const findFirst = vi.fn();
const updateTask = vi.fn();
const deleteTask = vi.fn();
const updateManyPosts = vi.fn();
const transaction = vi.fn();

vi.mock("@/lib/api/auth", () => ({
  requireUser: (...args: unknown[]) => requireUser(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    task: {
      findFirst: (...args: unknown[]) => findFirst(...args),
      update: (...args: unknown[]) => updateTask(...args),
      delete: (...args: unknown[]) => deleteTask(...args),
    },
    post: {
      updateMany: (...args: unknown[]) => updateManyPosts(...args),
    },
    $transaction: (...args: unknown[]) => transaction(...args),
  },
}));

const ownedTask = {
  id: 1,
  name: "マップ",
  status: "進行中",
  project: { id: 10, name: "RPG", ownerId: 1 },
};

describe("GET /api/projects/[projectId]/tasks/[taskId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireUser.mockResolvedValue({ id: 1, userId: "me", name: "自分" });
  });

  async function get(projectId: string, taskId: string) {
    const { GET } = await import("./route");
    return GET(
      new Request(`http://localhost:3000/api/projects/${projectId}/tasks/${taskId}`),
      { params: Promise.resolve({ projectId, taskId }) },
    );
  }

  it("登録者でタスクとプロジェクト名を返す", async () => {
    findFirst.mockResolvedValue(ownedTask);
    const response = await get("10", "1");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      task: { id: 1, name: "マップ", status: "進行中" },
      project: { id: 10, name: "RPG" },
    });
  });

  it("他ユーザーは 403、別プロジェクトの taskId と不正 ID は 404", async () => {
    findFirst.mockResolvedValue({
      ...ownedTask,
      project: { ...ownedTask.project, ownerId: 2 },
    });
    expect((await get("10", "1")).status).toBe(403);

    findFirst.mockResolvedValue(null);
    expect((await get("10", "1")).status).toBe(404);
    expect((await get("10", "abc")).status).toBe(404);
  });

  it("未ログインは 401", async () => {
    requireUser.mockRejectedValue(
      new ApiError(401, "UNAUTHORIZED", "ログインしてください。"),
    );
    expect((await get("10", "1")).status).toBe(401);
  });
});

describe("PATCH /api/projects/[projectId]/tasks/[taskId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireUser.mockResolvedValue({ id: 1, userId: "me", name: "自分" });
    findFirst.mockResolvedValue(ownedTask);
  });

  async function patch(projectId: string, taskId: string, body: unknown) {
    const { PATCH } = await import("./route");
    return PATCH(
      new Request(`http://localhost:3000/api/projects/${projectId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
      { params: Promise.resolve({ projectId, taskId }) },
    );
  }

  it("名前を更新し status 付きボディでも status は変えない", async () => {
    updateTask.mockResolvedValue({ id: 1, name: "新しいタスク", status: "進行中" });
    const response = await patch("10", "1", {
      name: "新しいタスク",
      status: "完了",
    });
    expect(response.status).toBe(200);
    expect(updateTask).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { name: "新しいタスク" },
      select: { id: true, name: true, status: true },
    });
    await expect(response.json()).resolves.toEqual({
      task: { id: 1, name: "新しいタスク", status: "進行中" },
    });
  });

  it("空白の名前は 422、他ユーザーは 403", async () => {
    expect((await patch("10", "1", { name: "  " })).status).toBe(422);

    findFirst.mockResolvedValue({
      ...ownedTask,
      project: { ...ownedTask.project, ownerId: 2 },
    });
    expect((await patch("10", "1", { name: "ok" })).status).toBe(403);
  });
});

describe("DELETE /api/projects/[projectId]/tasks/[taskId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireUser.mockResolvedValue({ id: 1, userId: "me", name: "自分" });
    findFirst.mockResolvedValue(ownedTask);
    transaction.mockImplementation(async (fn: (tx: {
      post: { updateMany: typeof updateManyPosts };
      task: { delete: typeof deleteTask };
    }) => unknown) =>
      fn({
        post: { updateMany: updateManyPosts },
        task: { delete: deleteTask },
      }),
    );
  });

  async function del(projectId: string, taskId: string) {
    const { DELETE } = await import("./route");
    return DELETE(
      new Request(`http://localhost:3000/api/projects/${projectId}/tasks/${taskId}`, {
        method: "DELETE",
      }),
      { params: Promise.resolve({ projectId, taskId }) },
    );
  }

  it("削除前に進捗投稿の status を null にし 200 を返す", async () => {
    updateManyPosts.mockResolvedValue({ count: 1 });
    deleteTask.mockResolvedValue({ id: 1 });
    const response = await del("10", "1");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(updateManyPosts).toHaveBeenCalledWith({
      where: { taskId: 1 },
      data: { status: null },
    });
    expect(deleteTask).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it("他ユーザーは 403 で Task が残る", async () => {
    findFirst.mockResolvedValue({
      ...ownedTask,
      project: { ...ownedTask.project, ownerId: 2 },
    });
    expect((await del("10", "1")).status).toBe(403);
    expect(deleteTask).not.toHaveBeenCalled();
  });
});
