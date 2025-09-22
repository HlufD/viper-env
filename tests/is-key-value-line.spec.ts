import { describe, it, expect } from "vitest";
import { isKeyValueLine } from "../src/utils/is-key-value-line.js";

describe("isKeyValueLine", () => {
  it("detects valid key=value lines", () => {
    expect(isKeyValueLine("PORT=3000")).toBe(true);
    expect(isKeyValueLine("API_KEY = 12345")).toBe(true);
    expect(isKeyValueLine("SOME_KEY=some value")).toBe(true);
    expect(isKeyValueLine("SPACED = spacedValue")).toBe(true);
    expect(isKeyValueLine("UNDER_SCORE_KEY=value")).toBe(true);
  });

  it("detects invalid lines", () => {
    expect(isKeyValueLine("   ")).toBe(false);
    expect(isKeyValueLine("# comment")).toBe(false);
    expect(isKeyValueLine("NOVALUE")).toBe(false);
    expect(isKeyValueLine("=value")).toBe(false);
    expect(isKeyValueLine("  = spaced")).toBe(false);
  });

  it("handles numeric keys", () => {
    expect(isKeyValueLine("K1=val")).toBe(true);
    expect(isKeyValueLine("1KEY=value")).toBe(true);
  });
});
