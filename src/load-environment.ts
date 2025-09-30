import { readEnvFile } from "./utils/read-env-file.js";

async function loadEnvironment(path: string) {
  const file = await readEnvFile(path);
  return new Map(Object.entries(file));
}

export { loadEnvironment };
