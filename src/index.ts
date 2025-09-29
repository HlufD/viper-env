import { buildEnvironmentDependencyGraph } from "./utils/build-environment-dependency-graph.js";
import { extractDefaultValuesFromDependencies } from "./utils/extract-default-values.js";
import { readEnvFile } from "./utils/read-env-file.js";
import { topologicalSort } from "./utils/topological-sort.js";

async function config(path: string = ".env") {
  const file = await readEnvFile(path);

  const environment = new Map(Object.entries(file));

  const dependencyGraph = buildEnvironmentDependencyGraph(environment);

  extractDefaultValuesFromDependencies(dependencyGraph, environment);

  const topologicalOrder = topologicalSort(dependencyGraph);

  for (const env of topologicalOrder) {
    if (dependencyGraph[env]) {
      for (const dependency of dependencyGraph[env]!) {
        const { dependency: key, placeholder, defaultValue } = dependency;

        if (!environment.get(key)) {
          environment.set(key, defaultValue!);
          process.env[key] = environment.get(key);
        }

        environment.set(
          env,
          environment.get(env)!.replace(placeholder, environment.get(key)!)
        );
      }
    }

    process.env[env] = environment.get(env);
  }

  return environment;
}

export { config };

const result = await config();
console.log(result);

// console.log("HOST:", process.env.HOST);
// console.log("PORT:", process.env.PORT);
// console.log("URL:", process.env.URL);
// console.log("FULL_URL:", process.env.FULL_URL);
