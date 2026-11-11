// POST /api/projects の権限・ownerId 固定ユニットテスト
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";

const requireUser = vi.fn();
const projectCreate = vi.fn();

vi.mock("@/lib/api/auth", () => ({
  requireUser: (...args: unknown[]) => requireUser(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    project: {
      create: (...args: unknown[]) => projectCreate(...args),
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
