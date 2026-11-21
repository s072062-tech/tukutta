// GET/PATCH/DELETE /api/projects/[projectId] のテスト
import { ApiError } from "@/lib/api/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getViewer = vi.fn();
const requireUser = vi.fn();
const findUnique = vi.fn();
const updateProject = vi.fn();
const deleteProject = vi.fn();
const updateManyPosts = vi.fn();
const transaction = vi.fn();
const hashtagUpsert = vi.fn();
const projectHashtagFindMany = vi.fn();
const projectHashtagCreateMany = vi.fn();
const projectHashtagDeleteMany = vi.fn();
const toProjectStampSummaries = vi.fn();

vi.mock("@/lib/api/auth", () => ({
  getViewer: (...args: unknown[]) => getViewer(...args),
  requireUser: (...args: unknown[]) => requireUser(...args),
}));

vi.mock("@/lib/api/projectStamp", () => ({
  toProjectStampSummaries: (...args: unknown[]) => toProjectStampSummaries(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: {
      findUnique: (...args: unknown[]) => findUnique(...args),
      update: (...args: unknown[]) => updateProject(...args),
      delete: (...args: unknown[]) => deleteProject(...args),
    },
    post: {
      updateMany: (...args: unknown[]) => updateManyPosts(...args),
    },
    $transaction: (...args: unknown[]) => transaction(...args),
  },
}));

function createTx() {
  return {
    project: {
      update: updateProject,
      delete: deleteProject,
    },
    post: { updateMany: updateManyPosts },
    hashtag: { upsert: hashtagUpsert },
    projectHashtag: {
      findMany: projectHashtagFindMany,
      createMany: projectHashtagCreateMany,
      deleteMany: projectHashtagDeleteMany,
    },
  };
}

describe("GET /api/projects/[projectId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getViewer.mockResolvedValue(null);
    toProjectStampSummaries.mockResolvedValue([]);
  });

  async function get(projectId: string) {
    const { GET } = await import("./route");
    return GET(new Request(`http://localhost:3000/api/projects/${projectId}`), {
      params: Promise.resolve({ projectId }),
    });
  }

  it("不正な projectId は 404 を返す", async () => {
    const response = await get("abc");
    expect(response.status).toBe(404);
  });

  it("存在しないプロジェクトは 404 を返す", async () => {
    findUnique.mockResolvedValue(null);
    const response = await get("999999");
    expect(response.status).toBe(404);
  });
});

describe("PATCH /api/projects/[projectId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireUser.mockResolvedValue({ id: 1, userId: "me", name: "自分" });
    transaction.mockImplementation(async (fn: (tx: ReturnType<typeof createTx>) => unknown) =>
      fn(createTx()),
    );
    projectHashtagFindMany.mockResolvedValue([]);
    hashtagUpsert.mockResolvedValue({ id: 1, name: "tag" });
    projectHashtagCreateMany.mockResolvedValue({ count: 0 });
    projectHashtagDeleteMany.mockResolvedValue({ count: 0 });
  });

  async function patch(projectId: string, body: unknown) {
    const { PATCH } = await import("./route");
    return PATCH(
      new Request(`http://localhost:3000/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
      { params: Promise.resolve({ projectId }) },
    );
  }

  it("登録者の更新が 200 で { id }、空概要は null", async () => {
    findUnique.mockResolvedValue({ id: 1, ownerId: 1 });
    updateProject.mockResolvedValue({ id: 1 });
    const response = await patch("1", { name: "新しい名前", description: "" });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ id: 1 });
    expect(updateProject).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { name: "新しい名前", description: null },
      select: { id: true },
    });
  });

  it("空白の名前は 422、他ユーザーは 403、未ログインは 401", async () => {
    findUnique.mockResolvedValue({ id: 1, ownerId: 1 });
    const invalid = await patch("1", { name: "  ", description: "" });
    expect(invalid.status).toBe(422);

    findUnique.mockResolvedValue({ id: 1, ownerId: 2 });
    expect((await patch("1", { name: "ok", description: null })).status).toBe(403);

    requireUser.mockRejectedValue(
      new ApiError(401, "UNAUTHORIZED", "ログインしてください。"),
    );
    expect((await patch("1", { name: "ok", description: null })).status).toBe(401);
  });
});

describe("DELETE /api/projects/[projectId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireUser.mockResolvedValue({ id: 1, userId: "me", name: "自分" });
    transaction.mockImplementation(async (fn: (tx: ReturnType<typeof createTx>) => unknown) =>
      fn(createTx()),
    );
  });

  async function del(projectId: string) {
    const { DELETE } = await import("./route");
    return DELETE(
      new Request(`http://localhost:3000/api/projects/${projectId}`, { method: "DELETE" }),
      { params: Promise.resolve({ projectId }) },
    );
  }

  it("登録者の削除が 200 で進捗投稿の status を先に null にする", async () => {
    findUnique.mockResolvedValue({ id: 1, ownerId: 1 });
    updateManyPosts.mockResolvedValue({ count: 1 });
    deleteProject.mockResolvedValue({ id: 1 });
    const response = await del("1");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(updateManyPosts).toHaveBeenCalledWith({
      where: { task: { projectId: 1 } },
      data: { status: null },
    });
    expect(deleteProject).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it("他ユーザーは 403、無い ID は 404", async () => {
    findUnique.mockResolvedValue({ id: 1, ownerId: 2 });
    expect((await del("1")).status).toBe(403);
    expect(deleteProject).not.toHaveBeenCalled();

    findUnique.mockResolvedValue(null);
    expect((await del("999")).status).toBe(404);
  });
});
