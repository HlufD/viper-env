function resolveDependencies(
  environment: Map<string, string>,
  dependencyGraph: Record<string, Array<any>>,
  topologicalOrder: string[]
) {
  for (const env of topologicalOrder) {
    if (dependencyGraph[env]) {
      for (const dependency of dependencyGraph[env]!) {
        const { dependency: key, placeholder, defaultValue } = dependency;

        if (!environment.get(key)) {
          environment.set(key, defaultValue!);
        }

        environment.set(
          env,
          environment.get(env)!.replace(placeholder, environment.get(key)!)
        );
      }
    }
  }
}
export { resolveDependencies };
