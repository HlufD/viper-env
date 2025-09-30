import { describe, it, expect } from "vitest";
import { parseEscapes } from "../../src/utils/parse-escapes";
describe("parseEscapes", () => {
  it("should return the same string if there are no escapes", () => {
    expect(parseEscapes("Hello World")).toBe("Hello World");
  });

  it("should parse newline escape", () => {
    expect(parseEscapes("Hello\\nWorld")).toBe("Hello\nWorld");
  });

  it("should parse tab escape", () => {
    expect(parseEscapes("Hello\\tWorld")).toBe("Hello\tWorld");
  });

  it("should parse carriage return escape", () => {
    expect(parseEscapes("Hello\\rWorld")).toBe("Hello\rWorld");
  });

  it("should parse backspace escape", () => {
    expect(parseEscapes("ABC\\bD")).toBe("ABC\bD");
  });

  it("should parse form feed escape", () => {
    expect(parseEscapes("Hello\\fWorld")).toBe("Hello\fWorld");
  });

  it("should parse escaped quotes", () => {
    expect(parseEscapes('He said: \\"')).toBe('He said: "');
    expect(parseEscapes("It\\'s fine")).toBe("It's fine");
  });

  it("should parse escaped backslash", () => {
    expect(parseEscapes("C:\\\\Path")).toBe("C:\\Path");
  });

  it("should parse escaped dollar sign", () => {
    expect(parseEscapes("Price: \\$100")).toBe("Price: $100");
  });

  it("should parse unicode escape sequences", () => {
    expect(parseEscapes("Omega: \\u03A9")).toBe("Omega: Ω"); // Ω
    expect(parseEscapes("Heart: \\u2764")).toBe("Heart: ❤"); // ❤
  });

  it("should leave unknown escapes unchanged", () => {
    expect(parseEscapes("Unknown: \\x")).toBe("Unknown: x");
    expect(parseEscapes("Something: \\z")).toBe("Something: z");
  });

  it("should handle multiple escapes in the same string", () => {
    expect(parseEscapes("Line1\\nLine2\\tTabbed\\u0021")).toBe(
      "Line1\nLine2\tTabbed!"
    );
  });

  it("should handle empty string", () => {
    expect(parseEscapes("")).toBe("");
  });

  it("should not throw on incomplete unicode escape", () => {
    // Regex expects 4 hex digits, so \u12 is not matched fully
    expect(parseEscapes("Bad: \\u12")).toBe("Bad: u12");
  });
});
