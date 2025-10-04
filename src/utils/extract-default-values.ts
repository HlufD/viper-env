import type { VariableDependencies } from "./get-variable-dependencies.js";

function extractDefaultValuesFromDependencies(
  dependencies: VariableDependencies,
  environment: Map<string, string>
) {
  for (const env in dependencies) {
    for (const variable of dependencies[env]!) {
      const match = variable.dependency.match(/:-[^}]*|:\?[^}]+/);

      if (match) {
        const token = match[0];

        if (token.startsWith(":-")) {
          const defaultValue = token.slice(2);
          variable.defaultValue = defaultValue;
        } else if (token.startsWith(":?")) {
          const error = token.slice(2);
          const depName = variable.dependency.replace(token, "");
          if (environment.get(depName) === undefined) {
            throw new Error(error);
          }
          variable.defaultValue = "";
        }

        variable.dependency = variable.dependency.replace(token, "");
        variable.placeholder = variable.placeholder.replace(token, "");
        if (environment.has(env)) {
          environment.set(env, environment.get(env)!.replace(token, ""));
        }

        continue;
      }

      variable.defaultValue = "";
    }
  }

  return dependencies;
}

export { extractDefaultValuesFromDependencies };
