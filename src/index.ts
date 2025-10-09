import { buildEnvironmentDependencyGraph } from "./utils/build-environment-dependency-graph.js";
import { extractDefaultValuesFromDependencies } from "./utils/extract-default-values.js";
import { topologicalSort } from "./utils/topological-sort.js";
import { loadEnvironment } from "./load-environment.js";
import { applyEscapeSequences } from "./apply-escape-sequences.js";
import { resolveDependencies } from "./resolve-dependencies.js";
import { validateSchema } from "./utils/validate-schema.js";

async function config(options?: EnvConfigOptions) {
  const environment = new Map<string, string>();
  await loadEnvironment(environment, options);
  applyEscapeSequences(environment);

  const dependencyGraph = buildEnvironmentDependencyGraph(environment);
  extractDefaultValuesFromDependencies(dependencyGraph, environment);

  const topologicalOrder = topologicalSort(dependencyGraph);
  if (options?.expand)
    resolveDependencies(environment, dependencyGraph, topologicalOrder);

  if (options?.schema) {
    validateSchema(environment, options);
  }

  return environment;
}

export { config };
