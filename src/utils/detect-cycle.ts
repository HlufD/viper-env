import type { DependencyGraph } from "./build-environment-dependency-graph.js";

function detectCycle(graph: DependencyGraph, startNode: string) {
  const visited = new Set();
  const stack = [startNode];

  while (stack.length > 0) {
    const currentNode = stack.pop();

    if (visited.has(currentNode)) return true;

    visited.add(currentNode);

    if (currentNode && graph[currentNode]) {
      for (const neighbor of graph[currentNode]) {
        stack.push(neighbor["dependency"]);
      }
    }
  }

  return false;
}

export { detectCycle };
