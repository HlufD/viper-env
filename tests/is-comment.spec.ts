import { describe, it, expect } from "vitest";
import { isCommentLine } from "../src/utils/is-comment.js";

describe("isCommentLine", () => {
  it("detects comment", () => {
    expect(isCommentLine("# comment")).toBe(true);
    expect(isCommentLine("   ")).toBe(false);
    expect(isCommentLine("NOVALUE")).toBe(false);
    expect(isCommentLine("PORT=3000")).toBe(false);
    expect(isCommentLine("PORT=3000 # comment")).toBe(false);
  });
});
