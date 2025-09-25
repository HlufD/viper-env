import { getVariableDependencies } from "./get-variable-dependencies.js";

interface VariableDependency {
  dependency: string;
  placeholder: string;
}

type DependencyGraph = Record<string, VariableDependency[]>;

function buildEnvironmentDependencyGraph(environment: Map<string, string>) {
  const dependencyGraph: DependencyGraph = {};

  for (const [variable, value] of environment) {
    const dependencies = getVariableDependencies(variable, value);
    dependencyGraph[variable] = dependencies[variable]!;
  }

  return dependencyGraph;
}

export { buildEnvironmentDependencyGraph };
export type { VariableDependency, DependencyGraph };
