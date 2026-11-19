// ハッシュタグ抽出・正規化・クエリ判定のユニットテスト
import {
  extractHashtags,
  hashtagNameFromQuery,
  isHashtagQuery,
  normalizeHashtagName,
  parseHashtagSegments,
} from "@/lib/hashtag";
import { describe, expect, it } from "vitest";

describe("normalizeHashtagName", () => {
  it("先頭の # を除き小文字化する", () => {
    expect(normalizeHashtagName("#Dev")).toBe("dev");
    expect(normalizeHashtagName("Dev")).toBe("dev");
  });
});

describe("extractHashtags", () => {
  it("#Dev と #dev を同じ正規化名にまとめる", () => {
    expect(extractHashtags("Hello #Dev and #dev #日本語")).toEqual([
      "dev",
      "日本語",
    ]);
  });

  it("# のみと C# は抽出しない", () => {
    expect(extractHashtags("ただの # と C# と foo#bar")).toEqual([]);
  });

  it("行頭と記号のあとの # は抽出する", () => {
    expect(extractHashtags("#start (#paren) 。#終わり")).toEqual([
      "start",
      "paren",
      "終わり",
    ]);
  });
});

describe("parseHashtagSegments", () => {
  it("タグ部分と通常部分に分ける", () => {
    expect(parseHashtagSegments("今日は #tukutta を進めた")).toEqual([
      { type: "text", value: "今日は " },
      { type: "tag", value: "#tukutta", name: "tukutta" },
      { type: "text", value: " を進めた" },
    ]);
  });
});

describe("isHashtagQuery / hashtagNameFromQuery", () => {
  it("#Dev をタグクエリと判定する", () => {
    expect(isHashtagQuery("#Dev")).toBe(true);
    expect(hashtagNameFromQuery("#Dev")).toBe("dev");
  });

  it("通常キーワードはタグクエリではない", () => {
    expect(isHashtagQuery("map")).toBe(false);
    expect(hashtagNameFromQuery("map")).toBeNull();
    expect(isHashtagQuery("#")).toBe(false);
  });
});
