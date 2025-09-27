import { buildEnvironmentDependencyGraph } from "./utils/build-environment-dependency-graph.js";
import { readEnvFile } from "./utils/read-env-file.js";
import { topologicalSort } from "./utils/topological-sort.js";

async function config(path: string = ".env") {
  const file = await readEnvFile(".env");
  const environment = new Map(Object.entries(file));
  const dependencyGraph = buildEnvironmentDependencyGraph(environment);
  const topologicalOrder = topologicalSort(dependencyGraph);

  for (const env of topologicalOrder) {
    for (const dependency of dependencyGraph[env]!) {
      const { dependency: key, placeholder } = dependency;

      environment.set(
        env,
        environment.get(env)!.replace(placeholder, environment.get(key)!)
      );
    }

    process.env[env] = environment.get(env);
  }

  return environment;
}

export { config };
