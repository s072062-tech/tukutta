// GET /api/users/[userId]/follows のクエリ検証・一覧整形テスト
import { beforeEach, describe, expect, it, vi } from "vitest";

const getViewer = vi.fn();
const getUserIdByHandle = vi.fn();
const findMany = vi.fn();

vi.mock("@/lib/api/auth", () => ({
  getViewer: (...args: unknown[]) => getViewer(...args),
}));

vi.mock("@/lib/api/user", () => ({
  getUserIdByHandle: (...args: unknown[]) => getUserIdByHandle(...args),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    userFollow: {
      findMany: (...args: unknown[]) => findMany(...args),
    },
  },
}));

describe("GET /api/users/[userId]/follows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getViewer.mockResolvedValue(null);
    getUserIdByHandle.mockResolvedValue(1);
  });

  async function get(query = "") {
    const { GET } = await import("./route");
    const url = `http://localhost:3000/api/users/alice/follows${query}`;
    return GET(new Request(url), {
      params: Promise.resolve({ userId: "alice" }),
    });
  }

  it("不正な type は 422 を返す", async () => {
    const response = await get("?type=xxx");
    expect(response.status).toBe(422);
    expect(findMany).not.toHaveBeenCalled();
  });

  it("不正な cursor は 422 を返す", async () => {
    const response = await get("?cursor=abc");
    expect(response.status).toBe(422);
    expect(findMany).not.toHaveBeenCalled();
  });

  it("0件なら items 空と nextCursor null を返す", async () => {
    findMany.mockResolvedValue([]);
    const response = await get();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ items: [], nextCursor: null });
  });

  it("following は followee を新しい順で返し、未ログインは isFollowing/isSelf が false", async () => {
    findMany.mockResolvedValue([
      {
        id: 10,
        followee: { id: 3, userId: "charlie", name: "Charlie" },
      },
      {
        id: 9,
        followee: { id: 2, userId: "bob", name: "Bob" },
      },
    ]);

    const response = await get("?type=following");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      items: [
        {
          id: 3,
          userId: "charlie",
          name: "Charlie",
          isFollowing: false,
          isSelf: false,
        },
        {
          id: 2,
          userId: "bob",
          name: "Bob",
          isFollowing: false,
          isSelf: false,
        },
      ],
      nextCursor: null,
    });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { followerId: 1 },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      }),
    );
  });

  it("ログイン中は isFollowing と isSelf を正しく付ける", async () => {
    getViewer.mockResolvedValue({ id: 5, userId: "viewer", name: "Viewer" });
    findMany.mockResolvedValue([
      {
        id: 20,
        follower: {
          id: 5,
          userId: "viewer",
          name: "Viewer",
          followers: [{ id: 99 }],
        },
      },
      {
        id: 19,
        follower: {
          id: 8,
          userId: "other",
          name: "Other",
          followers: [{ id: 98 }],
        },
      },
      {
        id: 18,
        follower: {
          id: 9,
          userId: "stranger",
          name: "Stranger",
          followers: [],
        },
      },
    ]);

    const response = await get("?type=followers");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      items: [
        {
          id: 5,
          userId: "viewer",
          name: "Viewer",
          isFollowing: false,
          isSelf: true,
        },
        {
          id: 8,
          userId: "other",
          name: "Other",
          isFollowing: true,
          isSelf: false,
        },
        {
          id: 9,
          userId: "stranger",
          name: "Stranger",
          isFollowing: false,
          isSelf: false,
        },
      ],
      nextCursor: null,
    });
  });

  it("PAGE_SIZE+1 件なら nextCursor を返し末尾を捨てる", async () => {
    const rows = Array.from({ length: 21 }, (_, index) => ({
      id: 100 - index,
      followee: {
        id: index + 1,
        userId: `user${index + 1}`,
        name: `User ${index + 1}`,
      },
    }));
    findMany.mockResolvedValue(rows);

    const response = await get();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.items).toHaveLength(20);
    expect(body.nextCursor).toBe(rows[19]!.id);
  });
});
