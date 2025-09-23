import { describe, it, expect } from "vitest";
import { containsComment } from "../../src/utils/contains-comment";

describe("containsComment", () => {
  it("should return true if line contains #", () => {
    expect(containsComment("PORT=3000 # local dev")).toBe(true);
    expect(containsComment("# full line comment")).toBe(true);
    expect(containsComment("API_KEY=123#test")).toBe(true);
  });

  it("should return false if line does not contain #", () => {
    expect(containsComment("PORT=3000")).toBe(false);
    expect(containsComment("HELLO=WORLD")).toBe(false);
    expect(containsComment("")).toBe(false);
  });
});
