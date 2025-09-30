import { buildEnvironmentDependencyGraph } from "./utils/build-environment-dependency-graph.js";
import { extractDefaultValuesFromDependencies } from "./utils/extract-default-values.js";
import { topologicalSort } from "./utils/topological-sort.js";
import { loadEnvironment } from "./load-environment.js";
import { applyEscapeSequences } from "./apply-escape-sequences.js";
import { resolveDependencies } from "./resolve-dependencies.js";

async function config(path: string = ".env") {
  const environment = await loadEnvironment(path);
  applyEscapeSequences(environment);
  const dependencyGraph = buildEnvironmentDependencyGraph(environment);
  extractDefaultValuesFromDependencies(dependencyGraph, environment);
  const topologicalOrder = topologicalSort(dependencyGraph);
  resolveDependencies(environment, dependencyGraph, topologicalOrder);
  return environment;
}

export { config };
