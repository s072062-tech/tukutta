// プロジェクトフォローの権限・自己フォロー拒否テスト
import { ApiError } from "@/lib/api/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUser = vi.fn();
const findUnique = vi.fn();
const upsert = vi.fn();
const deleteMany = vi.fn();

vi.mock("@/lib/api/auth", () => ({
  requireUser: (...args: unknown[]) => requireUser(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: {
      findUnique: (...args: unknown[]) => findUnique(...args),
    },
    projectFollow: {
      upsert: (...args: unknown[]) => upsert(...args),
      deleteMany: (...args: unknown[]) => deleteMany(...args),
    },
  },
}));

describe("POST /api/projects/[projectId]/follow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function post(projectId: string) {
    const { POST } = await import("./route");
    return POST(new Request(`http://localhost:3000/api/projects/${projectId}/follow`), {
      params: Promise.resolve({ projectId }),
    });
  }

  it("登録者自身は 422 を返す", async () => {
    requireUser.mockResolvedValue({ id: 1, userId: "me", name: "自分" });
    findUnique.mockResolvedValue({ id: 10, ownerId: 1 });
    const response = await post("10");
    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      error: { message: "自分のプロジェクトはフォローできません。" },
    });
  });

  it("未ログインなら 401 を返す", async () => {
    requireUser.mockRejectedValue(new ApiError(401, "UNAUTHORIZED", "ログインしてください。"));
    const response = await post("10");
    expect(response.status).toBe(401);
  });
});
