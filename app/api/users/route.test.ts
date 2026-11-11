// POST /api/users の権限・重複・正常系ユニットテスト
import { Prisma } from "@/app/generated/prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getAuthContext = vi.fn();
const userCreate = vi.fn();
const userFindUnique = vi.fn();

vi.mock("@/lib/api/auth", () => ({
  getAuthContext: (...args: unknown[]) => getAuthContext(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      create: (...args: unknown[]) => userCreate(...args),
      findUnique: (...args: unknown[]) => userFindUnique(...args),
    },
  },
}));

describe("POST /api/users", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function post(body: unknown) {
    const { POST } = await import("./route");
    return POST(
      new Request("http://localhost:3000/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
      { params: Promise.resolve({}) },
    );
  }

  it("未ログインなら 401 を返す", async () => {
    getAuthContext.mockResolvedValue({ authUser: null, user: null });
    const response = await post({ name: "佐藤", userId: "satogames" });
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "UNAUTHORIZED" },
    });
  });

  it("すでにプロフィールがある場合は 409 を返す", async () => {
    getAuthContext.mockResolvedValue({
      authUser: { id: "auth-1" },
      user: { id: 1, userId: "satogames", name: "佐藤" },
    });
    const response = await post({ name: "佐藤", userId: "satogames" });
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "CONFLICT", message: "プロフィールは登録済みです。" },
    });
  });

  it("正常なら 201 で User を返し trim 済みで create する", async () => {
    getAuthContext.mockResolvedValue({
      authUser: { id: "auth-1" },
      user: null,
    });
    userCreate.mockResolvedValue({ id: 1, userId: "satogames", name: "佐藤ゲームズ" });

    const response = await post({ name: "  佐藤ゲームズ  ", userId: "  satogames  " });
    expect(response.status).toBe(201);
    expect(userCreate).toHaveBeenCalledWith({
      data: { authUserId: "auth-1", userId: "satogames", name: "佐藤ゲームズ" },
      select: { id: true, userId: true, name: true },
    });
    await expect(response.json()).resolves.toEqual({
      user: { id: 1, userId: "satogames", name: "佐藤ゲームズ" },
    });
  });

  it("userId 重複なら 409 と fieldErrors.userId を返す", async () => {
    getAuthContext.mockResolvedValue({
      authUser: { id: "auth-1" },
      user: null,
    });
    userCreate.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint", {
        code: "P2002",
        clientVersion: "test",
      }),
    );
    userFindUnique.mockResolvedValue(null);

    const response = await post({ name: "佐藤", userId: "taken" });
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "CONFLICT",
        message: "このユーザーIDは使われています。",
        fieldErrors: { userId: ["このユーザーIDは使われています。"] },
      },
    });
  });
});
