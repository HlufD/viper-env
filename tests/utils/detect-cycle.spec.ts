import { describe, it, beforeEach, expect } from "vitest";
import { detectCycle } from "../../src/utils/detect-cycle";
import type { DependencyGraph } from "../../src/utils/build-environment-dependency-graph";

describe("detectCycle", () => {
  let acyclicGraph: DependencyGraph;
  let cyclicGraph: DependencyGraph;
  let selfLoopGraph: DependencyGraph;
  let disconnectedGraph: DependencyGraph;
  let complexGraph: DependencyGraph;

  beforeEach(() => {
    acyclicGraph = {
      A: [
        { dependency: "B", placeholder: "${B}" },
        { dependency: "C", placeholder: "${C}" },
      ],
      B: [{ dependency: "D", placeholder: "${D}" }],
      C: [{ dependency: "E", placeholder: "${E}" }],
      D: [],
      E: [],
    };

    cyclicGraph = {
      A: [{ dependency: "B", placeholder: "${B}" }],
      B: [{ dependency: "C", placeholder: "${C}" }],
      C: [{ dependency: "A", placeholder: "${A}" }],
    };

    selfLoopGraph = {
      A: [{ dependency: "A", placeholder: "${A}" }],
    };

    disconnectedGraph = {
      A: [{ dependency: "B", placeholder: "${B}" }],
      B: [],
      C: [{ dependency: "D", placeholder: "${D}" }],
      D: [],
    };

    complexGraph = {
      A: [
        { dependency: "B", placeholder: "${B}" },
        { dependency: "C", placeholder: "${C}" },
      ],
      B: [{ dependency: "D", placeholder: "${D}" }],
      C: [
        { dependency: "E", placeholder: "${E}" },
        { dependency: "F", placeholder: "${F}" },
      ],
      D: [{ dependency: "A", placeholder: "${A}" }],
      E: [{ dependency: "F", placeholder: "${F}" }],
      F: [{ dependency: "C", placeholder: "${C}" }],
    };
  });

  it("should return false for an acyclic graph", () => {
    expect(detectCycle(acyclicGraph, "A")).toBe(false);
  });

  it("should detect a simple cycle", () => {
    expect(detectCycle(cyclicGraph, "A")).toBe(true);
  });

  it("should detect a self-loop as a cycle", () => {
    expect(detectCycle(selfLoopGraph, "A")).toBe(true);
  });

  it("should return false for a disconnected acyclic component", () => {
    expect(detectCycle(disconnectedGraph, "A")).toBe(false);
    expect(detectCycle(disconnectedGraph, "C")).toBe(false);
  });

  it("should detect cycles in a complex graph", () => {
    expect(detectCycle(complexGraph, "A")).toBe(true);
    expect(detectCycle(complexGraph, "C")).toBe(true);
  });

  it("should return false for nodes with no outgoing edges", () => {
    expect(detectCycle(acyclicGraph, "D")).toBe(false);
    expect(detectCycle(acyclicGraph, "E")).toBe(false);
  });

  it("should not falsely detect cycles if node not connected to cycle", () => {
    expect(detectCycle(disconnectedGraph, "B")).toBe(false);
    expect(detectCycle(disconnectedGraph, "D")).toBe(false);
  });

  it("should handle empty graph", () => {
    expect(detectCycle({}, "A")).toBe(false);
  });
});
