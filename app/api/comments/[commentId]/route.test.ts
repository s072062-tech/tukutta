// DELETE /api/comments/[commentId] の権限テスト
import { ApiError } from "@/lib/api/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUser = vi.fn();
const findUnique = vi.fn();
const deleteComment = vi.fn();

vi.mock("@/lib/api/auth", () => ({
  requireUser: (...args: unknown[]) => requireUser(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    postComment: {
      findUnique: (...args: unknown[]) => findUnique(...args),
      delete: (...args: unknown[]) => deleteComment(...args),
    },
  },
}));

describe("DELETE /api/comments/[commentId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function del(commentId: string) {
    const { DELETE } = await import("./route");
    return DELETE(
      new Request(`http://localhost:3000/api/comments/${commentId}`, {
        method: "DELETE",
      }),
      { params: Promise.resolve({ commentId }) },
    );
  }

  it("作者の DELETE が 200 { id }", async () => {
    requireUser.mockResolvedValue({ id: 1, userId: "me", name: "自分" });
    findUnique.mockResolvedValue({ id: 7, authorId: 1 });
    deleteComment.mockResolvedValue({});

    const response = await del("7");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ id: 7 });
  });

  it("他人は 403 で行が残る", async () => {
    requireUser.mockResolvedValue({ id: 2, userId: "other", name: "他人" });
    findUnique.mockResolvedValue({ id: 7, authorId: 1 });

    const response = await del("7");
    expect(response.status).toBe(403);
    expect(deleteComment).not.toHaveBeenCalled();
  });

  it("未ログインは 401", async () => {
    requireUser.mockRejectedValue(
      new ApiError(401, "UNAUTHORIZED", "ログインしてください。"),
    );
    const response = await del("7");
    expect(response.status).toBe(401);
  });

  it("無い id は 404", async () => {
    requireUser.mockResolvedValue({ id: 1, userId: "me", name: "自分" });
    findUnique.mockResolvedValue(null);
    const response = await del("999");
    expect(response.status).toBe(404);
  });
});
