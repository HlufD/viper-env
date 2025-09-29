import { describe, it, expect } from "vitest";
import { getVariableDependencies } from "../../src/utils/get-variable-dependencies";

describe("getVariableDependencies", () => {
  it("should return empty array for a variable with no dependencies", () => {
    const result = getVariableDependencies("A", "simpleValue");
    expect(result).toEqual({ A: [] });
  });

  it("should detect a single dependency", () => {
    const result = getVariableDependencies("A", "${B}");
    expect(result).toEqual({ A: [{ dependency: "B", placeholder: "${B}" }] });
  });

  it("should detect multiple dependencies", () => {
    const result = getVariableDependencies("A", "${B} and ${C}");
    expect(result).toEqual({
      A: [
        { dependency: "B", placeholder: "${B}" },
        { dependency: "C", placeholder: "${C}" },
      ],
    });
  });

  it("should ignore text around dependencies", () => {
    const result = getVariableDependencies("A", "Start ${B} middle ${C} end");
    expect(result).toEqual({
      A: [
        { dependency: "B", placeholder: "${B}" },
        { dependency: "C", placeholder: "${C}" },
      ],
    });
  });

  it("should handle repeated dependencies", () => {
    const result = getVariableDependencies("A", "${B} ${B} ${C}");
    expect(result).toEqual({
      A: [
        { dependency: "B", placeholder: "${B}" },
        { dependency: "B", placeholder: "${B}" },
        { dependency: "C", placeholder: "${C}" },
      ],
    });
  });

  it("should handle empty string value", () => {
    const result = getVariableDependencies("A", "");
    expect(result).toEqual({ A: [] });
  });

  it("should handle value that is not a string", () => {
    const result1 = getVariableDependencies("A", null as any);
    expect(result1).toEqual({ A: [] });

    const result2 = getVariableDependencies("A", undefined);
    expect(result2).toEqual({ A: [] });

    const result3 = getVariableDependencies("A", 123 as any);
    expect(result3).toEqual({ A: [] });
  });

  it("should handle variables with special characters in names", () => {
    const result = getVariableDependencies("A", "${VAR_1} and ${VAR-2}");
    expect(result).toEqual({
      A: [
        { dependency: "VAR_1", placeholder: "${VAR_1}" },
        { dependency: "VAR-2", placeholder: "${VAR-2}" },
      ],
    });
  });

  it("should return empty array if value has only text and symbols", () => {
    const result = getVariableDependencies("A", "hello world! @#$%");
    expect(result).toEqual({ A: [] });
  });
});
