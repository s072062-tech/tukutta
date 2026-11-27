// DELETE /api/user-self の認証・削除テスト
import { ApiError } from "@/lib/api/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUser = vi.fn();
const userDelete = vi.fn();
const deleteUser = vi.fn();

vi.mock("@/lib/api/auth", () => ({
  requireUser: (...args: unknown[]) => requireUser(...args),
  getAuthContext: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      delete: (...args: unknown[]) => userDelete(...args),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    auth: {
      admin: {
        deleteUser: (...args: unknown[]) => deleteUser(...args),
      },
    },
  }),
}));

describe("DELETE /api/user-self", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function del() {
    const { DELETE } = await import("./route");
    return DELETE(new Request("http://localhost:3000/api/user-self", { method: "DELETE" }));
  }

  it("未ログインなら 401 を返す", async () => {
    requireUser.mockRejectedValue(
      new ApiError(401, "UNAUTHORIZED", "ログインしてください。"),
    );
    const response = await del();
    expect(response.status).toBe(401);
    expect(userDelete).not.toHaveBeenCalled();
  });

  it("User と Auth ユーザーを削除して 200 を返す", async () => {
    requireUser.mockResolvedValue({
      id: 7,
      userId: "me",
      name: "自分",
      authUserId: "auth-7",
    });
    userDelete.mockResolvedValue({ id: 7 });
    deleteUser.mockResolvedValue({ error: null });

    const response = await del();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(userDelete).toHaveBeenCalledWith({ where: { id: 7 } });
    expect(deleteUser).toHaveBeenCalledWith("auth-7");
  });

  it("Auth 削除が失敗しても Prisma 削除後は 200 を返す", async () => {
    requireUser.mockResolvedValue({
      id: 7,
      userId: "me",
      name: "自分",
      authUserId: "auth-7",
    });
    userDelete.mockResolvedValue({ id: 7 });
    deleteUser.mockResolvedValue({ error: { message: "not found" } });

    const response = await del();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });
});
