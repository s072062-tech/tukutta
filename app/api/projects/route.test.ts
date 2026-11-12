// GET/POST /api/projects の権限・検証・一覧応答ユニットテスト
import { ApiError } from "@/lib/api/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUser = vi.fn();
const projectCreate = vi.fn();
const projectFindMany = vi.fn();
const projectCount = vi.fn();
const toProjectCards = vi.fn();

vi.mock("@/lib/api/auth", () => ({
  requireUser: (...args: unknown[]) => requireUser(...args),
}));

vi.mock("@/lib/api/projectCard", () => ({
  projectCardSelect: { id: true },
  toProjectCards: (...args: unknown[]) => toProjectCards(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: {
      create: (...args: unknown[]) => projectCreate(...args),
      findMany: (...args: unknown[]) => projectFindMany(...args),
      count: (...args: unknown[]) => projectCount(...args),
    },
  },
}));

describe("POST /api/projects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function post(body: unknown) {
    const { POST } = await import("./route");
    return POST(
      new Request("http://localhost:3000/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
      { params: Promise.resolve({}) },
    );
  }

  it("未ログインなら 401 を返す", async () => {
    requireUser.mockRejectedValue(new ApiError(401, "UNAUTHORIZED", "ログインしてください。"));
    const response = await post({ name: "新作", description: null });
    expect(response.status).toBe(401);
  });

  it("プロフィール未登録なら 403 PROFILE_REQUIRED を返す", async () => {
    requireUser.mockRejectedValue(
      new ApiError(403, "PROFILE_REQUIRED", "ユーザー名とユーザーIDを登録してください。"),
    );
    const response = await post({ name: "新作", description: null });
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "PROFILE_REQUIRED" },
    });
  });

  it("ボディの ownerId を無視しログインユーザーを owner にする", async () => {
    requireUser.mockResolvedValue({ id: 10, userId: "me", name: "自分" });
    projectCreate.mockResolvedValue({ id: 99 });

    const response = await post({
      name: "新作",
      description: "説明",
      ownerId: 999,
    });

    expect(response.status).toBe(201);
    expect(projectCreate).toHaveBeenCalledWith({
      data: { name: "新作", description: "説明", ownerId: 10 },
      select: { id: true },
    });
    await expect(response.json()).resolves.toEqual({ project: { id: 99 } });
  });
});

describe("GET /api/projects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function get(query = "") {
    const { GET } = await import("./route");
    return GET(new Request(`http://localhost:3000/api/projects${query}`));
  }

  it("全ユーザータブで items / total / nextCursor を返す", async () => {
    const row = {
      id: 1,
      name: "カピバラ",
      description: null,
      owner: { id: 2, userId: "owner", name: "オーナー" },
    };
    projectFindMany.mockResolvedValue([row]);
    projectCount.mockResolvedValue(1);
    toProjectCards.mockResolvedValue([
      {
        id: 1,
        name: "カピバラ",
        description: null,
        owner: { id: 2, userId: "owner", name: "オーナー" },
        taskCounts: { total: 0, 未着手: 0, 進行中: 0, 完了: 0 },
      },
    ]);

    const response = await get();
    expect(response.status).toBe(200);
    expect(requireUser).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      items: [
        {
          id: 1,
          name: "カピバラ",
          description: null,
          owner: { id: 2, userId: "owner", name: "オーナー" },
          taskCounts: { total: 0, 未着手: 0, 進行中: 0, 完了: 0 },
        },
      ],
      nextCursor: null,
      total: 1,
    });
  });

  it("未ログインの following は 401 を返す", async () => {
    requireUser.mockRejectedValue(new ApiError(401, "UNAUTHORIZED", "ログインしてください。"));
    const response = await get("?tab=following");
    expect(response.status).toBe(401);
  });

  it("不正な cursor は 422 を返す", async () => {
    const response = await get("?cursor=abc");
    expect(response.status).toBe(422);
  });
});
