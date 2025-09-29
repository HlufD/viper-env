import type { VariableDependencies } from "./get-variable-dependencies.js";

function extractDefaultValuesFromDependencies(
  dependencies: VariableDependencies,
  environment: Map<string, string>
) {
  for (const env in dependencies) {
    for (const variables of dependencies[env]!) {
      const match = variables.dependency.match(/:-[^}]+/g);

      if (match && match?.length! > 0) {
        variables.defaultValue = match[0].split(":-")[1]!;
        variables.dependency = variables.dependency.replace(match[0], "");
        variables.placeholder = variables.placeholder.replace(match[0], "");
        // change the environments map also -> to correctly resolve the dependency
        environment.set(env, environment.get(env)!.replace(match[0], ""));
        continue;
      }
      variables.defaultValue = "";
    }
  }
  return dependencies;
}

export { extractDefaultValuesFromDependencies };
