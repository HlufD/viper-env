interface Dependency {
  dependency: string;
  placeholder: string;
  defaultValue?: string;
}

type VariableDependencies = Record<string, Dependency[]>;

function getVariableDependencies(
  variableName: string,
  value?: string
): VariableDependencies {
  const dependencies: VariableDependencies = { [variableName]: [] };

  if (typeof value !== "string") return dependencies;

  const matches: RegExpMatchArray[] = Array.from(
    value.matchAll(/\$\{([^}]+)\}|\$([a-zA-Z0-9]+)/g)
  );

  for (const match of matches) {
    const depName = match[1] || match[2];
    if (depName && dependencies[variableName]) {
      dependencies[variableName].push({
        dependency: depName,
        placeholder: match[0],
      });
    }
  }

  return dependencies;
}

export { getVariableDependencies };
export type { VariableDependencies };
