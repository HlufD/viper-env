import type { DependencyGraph } from "./build-environment-dependency-graph.js";

function topologicalSort(graph: DependencyGraph): string[] {
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const order: string[] = [];

  for (const node in graph) {
    if (!visited.has(node)) {
      dfs(node);
    }
  }

  function dfs(startNode: string) {
    const stack = [[startNode, false]];

    while (stack.length > 0) {
      const [currNode, processed] = stack.pop()! as [string, boolean];

      if (processed) {
        visiting.delete(currNode);
        order.push(currNode);
        visited.add(currNode);
        continue;
      }

      if (visiting.has(currNode)) {
        throw new Error(`Cycle detected at node ${currNode}`);
      }

      visiting.add(currNode);

      stack.push([currNode, true]);

      for (const neighbor of graph[currNode]!) {
        if (!visited.has(neighbor.dependency)) {
          stack.push([neighbor.dependency, false]);
        }
      }
    }
  }

  return order;
}

export { topologicalSort };
