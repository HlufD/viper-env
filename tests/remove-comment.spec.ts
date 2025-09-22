import { describe, it, expect } from "vitest";
import { removeComment } from "../src/utils/remove-comment";

describe("remove Comment", () => {
  it("should remove inline comments after #", () => {
    expect(removeComment("PORT=3000 # local dev")).toBe("PORT=3000");
    expect(removeComment("API_KEY=123#test")).toBe("API_KEY=123");
  });

  it("should return empty string if line is only a comment", () => {
    expect(removeComment("# just a comment")).toBe("");
  });

  it("should return the same string if no # exists", () => {
    expect(removeComment("HELLO=WORLD")).toBe("HELLO=WORLD");
    expect(removeComment("PORT=3000")).toBe("PORT=3000");
  });

  it("should trim spaces properly", () => {
    expect(removeComment("  PORT=3000    # comment ")).toBe("PORT=3000");
  });

  it("should handle empty string input", () => {
    expect(removeComment("")).toBe("");
  });
});
