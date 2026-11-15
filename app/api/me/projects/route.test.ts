// GET /api/me/projects の認証と一覧テスト
import { ApiError } from "@/lib/api/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUser = vi.fn();
const findMany = vi.fn();

vi.mock("@/lib/api/auth", () => ({
  requireUser: (...args: unknown[]) => requireUser(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: {
      findMany: (...args: unknown[]) => findMany(...args),
    },
  },
}));

describe("GET /api/me/projects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function get() {
    const { GET } = await import("./route");
    return GET(new Request("http://localhost:3000/api/me/projects"), {
      params: Promise.resolve({}),
    });
  }

  it("未ログインなら 401", async () => {
    requireUser.mockRejectedValue(
      new ApiError(401, "UNAUTHORIZED", "ログインしてください。"),
    );
    const response = await get();
    expect(response.status).toBe(401);
  });

  it("自分のプロジェクトを名前昇順で返す", async () => {
    requireUser.mockResolvedValue({ id: 1, userId: "me", name: "自分" });
    findMany.mockResolvedValue([
      {
        id: 2,
        name: "B",
        tasks: [{ id: 1, name: "t1", status: "未着手" }],
      },
    ]);

    const response = await get();
    expect(response.status).toBe(200);
    expect(findMany).toHaveBeenCalledWith({
      where: { ownerId: 1 },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        tasks: {
          select: { id: true, name: true, status: true },
          orderBy: { name: "asc" },
        },
      },
    });
    await expect(response.json()).resolves.toEqual({
      projects: [
        {
          id: 2,
          name: "B",
          tasks: [{ id: 1, name: "t1", status: "未着手" }],
        },
      ],
    });
  });

  it("0件は空配列", async () => {
    requireUser.mockResolvedValue({ id: 1, userId: "me", name: "自分" });
    findMany.mockResolvedValue([]);
    const response = await get();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ projects: [] });
  });
});
