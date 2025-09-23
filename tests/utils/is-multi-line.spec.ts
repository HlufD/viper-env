import { describe, it, expect } from "vitest";
import { isMultiLine } from "../../src/utils/is-multi-line";

describe("isMultiLine", () => {
  it("detects multi line (start of multiline)", () => {
    expect(isMultiLine("'Hello")).toBe(true);
    expect(isMultiLine('"Hello')).toBe(true);
    expect(isMultiLine('"')).toBe(true);
    expect(isMultiLine("'")).toBe(true);
  });

  it("detects non multi line", () => {
    expect(isMultiLine('"Hello"')).toBe(false);
    expect(isMultiLine("'Hello'")).toBe(false);
    expect(isMultiLine("Hello")).toBe(false);
    expect(isMultiLine("PORT=3000")).toBe(false);
  });
});
