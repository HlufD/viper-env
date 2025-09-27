// topological-sort.test.ts
import { describe, it, expect } from "vitest";
import { topologicalSort } from "../../src/utils/topological-sort.js";

describe("topologicalSort", () => {
  it("1. should sort a simple dependency chain", () => {
    const graph = {
      A: [],
      B: [{ dependency: "A", placeholder: "${A}" }],
      C: [{ dependency: "B", placeholder: "${B}" }],
    };
    const order = topologicalSort(graph);
    expect(order).toEqual(["A", "B", "C"]);
  });

  it("2. should sort multiple dependencies correctly", () => {
    const graph = {
      HOST: [],
      PORT: [],
      URL: [
        { dependency: "HOST", placeholder: "${HOST}" },
        { dependency: "PORT", placeholder: "${PORT}" },
      ],
      FULL_URL: [{ dependency: "URL", placeholder: "${URL}" }],
    };
    const order = topologicalSort(graph);
    expect(order.indexOf("HOST")).toBeLessThan(order.indexOf("URL"));
    expect(order.indexOf("PORT")).toBeLessThan(order.indexOf("URL"));
    expect(order.indexOf("URL")).toBeLessThan(order.indexOf("FULL_URL"));
  });

  it("3. should handle nodes with no dependencies", () => {
    const graph = {
      X: [],
      Y: [],
      Z: [],
    };
    const order = topologicalSort(graph);
    expect(new Set(order)).toEqual(new Set(["X", "Y", "Z"]));
  });

  it("4. should throw on simple cycle", () => {
    const cyclicGraph = {
      A: [{ dependency: "B", placeholder: "${B}" }],
      B: [{ dependency: "A", placeholder: "${A}" }],
    };
    expect(() => topologicalSort(cyclicGraph)).toThrow(/Cycle detected/);
  });

  it("5. should throw on self-loop", () => {
    const selfLoop = {
      A: [{ dependency: "A", placeholder: "${A}" }],
    };
    expect(() => topologicalSort(selfLoop)).toThrow(/Cycle detected/);
  });

  it("6. should handle disconnected graph", () => {
    const graph = {
      A: [],
      B: [],
      C: [{ dependency: "A", placeholder: "${A}" }],
      D: [],
    };
    const order = topologicalSort(graph);
    expect(order.indexOf("A")).toBeLessThan(order.indexOf("C"));
    expect(new Set(order)).toEqual(new Set(["A", "B", "C", "D"]));
  });

  it("7. should handle multiple independent chains", () => {
    const graph = {
      A: [],
      B: [{ dependency: "A", placeholder: "${A}" }],
      X: [],
      Y: [{ dependency: "X", placeholder: "${X}" }],
    };
    const order = topologicalSort(graph);
    expect(order.indexOf("A")).toBeLessThan(order.indexOf("B"));
    expect(order.indexOf("X")).toBeLessThan(order.indexOf("Y"));
  });

  it("8. single node graph", () => {
    const graph = { A: [] };
    const order = topologicalSort(graph);
    expect(order).toEqual(["A"]);
  });

  it("9. complex graph with multiple levels", () => {
    const graph = {
      A: [],
      B: [{ dependency: "A", placeholder: "${A}" }],
      C: [{ dependency: "A", placeholder: "${A}" }],
      D: [
        { dependency: "B", placeholder: "${B}" },
        { dependency: "C", placeholder: "${C}" },
      ],
    };
    const order = topologicalSort(graph);
    expect(order.indexOf("A")).toBeLessThan(order.indexOf("B"));
    expect(order.indexOf("A")).toBeLessThan(order.indexOf("C"));
    expect(order.indexOf("B")).toBeLessThan(order.indexOf("D"));
    expect(order.indexOf("C")).toBeLessThan(order.indexOf("D"));
  });

  it("10. should throw on indirect cycle", () => {
    const graph = {
      A: [{ dependency: "B", placeholder: "${B}" }],
      B: [{ dependency: "C", placeholder: "${C}" }],
      C: [{ dependency: "A", placeholder: "${A}" }],
    };
    expect(() => topologicalSort(graph)).toThrow(/Cycle detected/);
  });
});
