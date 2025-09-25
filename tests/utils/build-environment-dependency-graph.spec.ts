import { describe, it, expect } from "vitest";
import { buildEnvironmentDependencyGraph } from "../../src/utils/build-environment-dependency-graph";
import type {
  DependencyGraph,
  VariableDependency,
} from "../../src/utils/build-environment-dependency-graph";

describe("buildEnvironmentDependencyGraph", () => {
  it("should return empty graph for empty environment", () => {
    const env = new Map<string, string>();
    const result: DependencyGraph = buildEnvironmentDependencyGraph(env);
    expect(result).toEqual({});
  });

  it("should handle variables with no dependencies", () => {
    const env = new Map<string, string>([
      ["A", "value1"],
      ["B", "value2"],
    ]);
    const result: DependencyGraph = buildEnvironmentDependencyGraph(env);
    expect(result).toEqual({
      A: [],
      B: [],
    });
  });

  it("should detect a single dependency", () => {
    const env = new Map<string, string>([["A", "${B}"]]);
    const result: DependencyGraph = buildEnvironmentDependencyGraph(env);
    expect(result).toEqual({
      A: [{ dependency: "B", placeholder: "${B}" }],
    });
  });

  it("should detect multiple dependencies", () => {
    const env = new Map<string, string>([
      ["A", "${B} and ${C}"],
      ["B", "valueB"],
      ["C", "valueC"],
    ]);
    const result: DependencyGraph = buildEnvironmentDependencyGraph(env);
    expect(result).toEqual({
      A: [
        { dependency: "B", placeholder: "${B}" },
        { dependency: "C", placeholder: "${C}" },
      ],
      B: [],
      C: [],
    });
  });

  it("should handle repeated dependencies", () => {
    const env = new Map<string, string>([["A", "${B} ${B} ${C}"]]);
    const result: DependencyGraph = buildEnvironmentDependencyGraph(env);
    expect(result).toEqual({
      A: [
        { dependency: "B", placeholder: "${B}" },
        { dependency: "B", placeholder: "${B}" },
        { dependency: "C", placeholder: "${C}" },
      ],
    });
  });

  it("should handle text mixed with dependencies", () => {
    const env = new Map<string, string>([["A", "Start ${B} middle ${C} end"]]);
    const result: DependencyGraph = buildEnvironmentDependencyGraph(env);
    expect(result).toEqual({
      A: [
        { dependency: "B", placeholder: "${B}" },
        { dependency: "C", placeholder: "${C}" },
      ],
    });
  });

  it("should handle special characters in variable names", () => {
    const env = new Map<string, string>([["A", "${VAR_1} and ${VAR-2}"]]);
    const result: DependencyGraph = buildEnvironmentDependencyGraph(env);
    expect(result).toEqual({
      A: [
        { dependency: "VAR_1", placeholder: "${VAR_1}" },
        { dependency: "VAR-2", placeholder: "${VAR-2}" },
      ],
    });
  });

  it("should handle variables referencing non-existent variables", () => {
    const env = new Map<string, string>([
      ["A", "${B}"],
      ["B", "${C}"],
    ]);
    const result: DependencyGraph = buildEnvironmentDependencyGraph(env);
    expect(result).toEqual({
      A: [{ dependency: "B", placeholder: "${B}" }],
      B: [{ dependency: "C", placeholder: "${C}" }],
    });
  });

  it("should handle complex multiple variables", () => {
    const env = new Map<string, string>([
      ["A", "${B} ${C}"],
      ["B", "${D}"],
      ["C", "valueC"],
      ["D", "${E}"],
      ["E", "valueE"],
    ]);
    const result: DependencyGraph = buildEnvironmentDependencyGraph(env);
    expect(result).toEqual({
      A: [
        { dependency: "B", placeholder: "${B}" },
        { dependency: "C", placeholder: "${C}" },
      ],
      B: [{ dependency: "D", placeholder: "${D}" }],
      C: [],
      D: [{ dependency: "E", placeholder: "${E}" }],
      E: [],
    });
  });

  it("should ignore variables with undefined or non-string values", () => {
    const env = new Map<string, any>([
      ["A", "${B}"],
      ["B", undefined],
      ["C", null],
      ["D", 123],
    ]);
    const result: DependencyGraph = buildEnvironmentDependencyGraph(env);
    expect(result).toEqual({
      A: [{ dependency: "B", placeholder: "${B}" }],
      B: [],
      C: [],
      D: [],
    });
  });

  it("should handle variables that reference themselves", () => {
    const env = new Map<string, string>([["A", "${A}"]]);
    const result: DependencyGraph = buildEnvironmentDependencyGraph(env);
    expect(result).toEqual({
      A: [{ dependency: "A", placeholder: "${A}" }],
    });
  });

  it("should handle multiple variables referencing each other cyclically", () => {
    const env = new Map<string, string>([
      ["A", "${B}"],
      ["B", "${C}"],
      ["C", "${A}"],
    ]);
    const result: DependencyGraph = buildEnvironmentDependencyGraph(env);
    expect(result).toEqual({
      A: [{ dependency: "B", placeholder: "${B}" }],
      B: [{ dependency: "C", placeholder: "${C}" }],
      C: [{ dependency: "A", placeholder: "${A}" }],
    });
  });
});
