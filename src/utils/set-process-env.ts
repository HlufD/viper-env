function setProcessEnv(environment: Map<string, string>) {
  for (const [key, value] of environment) {
    process.env[`${key}`] = value;
  }
}

export { setProcessEnv };
