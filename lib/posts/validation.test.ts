import { describe, expect, it } from "vitest";
import { canEditPost, validatePostInput } from "./validation";

describe("validatePostInput", () => {
  it("returns null for valid title and content", () => {
    expect(validatePostInput("제목", "내용")).toBeNull();
  });

  it("rejects empty title", () => {
    expect(validatePostInput("  ", "내용")).toEqual({
      title: "제목을 입력하세요.",
    });
  });

  it("rejects empty content", () => {
    expect(validatePostInput("제목", "")).toEqual({
      content: "내용을 입력하세요.",
    });
  });
});

describe("canEditPost", () => {
  it("allows author", () => {
    expect(canEditPost("uuid-a", "uuid-a")).toBe(true);
  });

  it("denies other users", () => {
    expect(canEditPost("uuid-a", "uuid-b")).toBe(false);
  });

  it("denies anonymous", () => {
    expect(canEditPost("uuid-a", undefined)).toBe(false);
  });
});
