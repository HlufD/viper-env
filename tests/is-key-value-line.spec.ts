import { describe, it, expect } from "vitest";
import { isKeyValueLine } from "../src/utils/is-key-value-line";

describe("isKeyValueLine", () => {
  it("detects valid key=value lines", () => {
    expect(isKeyValueLine("PORT=3000")).toBe(true);
  });

  it("detects invalid lines", () => {
    expect(isKeyValueLine("   ")).toBe(false);
    expect(isKeyValueLine("# comment")).toBe(false);
    expect(isKeyValueLine("NOVALUE")).toBe(false);
  });
});
