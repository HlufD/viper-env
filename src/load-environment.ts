import path from "node:path";
import { readEnvFile } from "./utils/read-env-file.js";
import fs from "node:fs";

const defaultEnvFiles = [
  `.env`,
  `.env.local`,
  `.env.${process.env.NODE_ENV || "development"}`,
  `.env.${process.env.NODE_ENV || "development"}.local`,
];

async function loadEnvironment(
  customFilePath: string | null,
  environment: Map<string, string>
) {
  const cwd = process.cwd();
  let allFiles: string[] = [];

  if (customFilePath) {
    const resolved = path.resolve(cwd, customFilePath);

    if (!resolved.startsWith(cwd)) {
      console.warn(`[ENV WARN] Custom env file "${customFilePath}" is outside project directory.`);
      return environment;
    }

    if (!path.basename(resolved).startsWith(".env")) {
      console.warn(`[ENV WARN] Custom env file "${customFilePath}" does not start with ".env".`);
      return environment;
    }

    if (!fs.existsSync(resolved)) {
      console.warn(`[ENV WARN] Custom env file "${customFilePath}" does not exist.`);
      return environment;
    }

    allFiles = [resolved];
  } else {
    allFiles = defaultEnvFiles.map((f) => path.resolve(cwd, f));
  }

  const existingEnvPaths = allFiles.filter(fs.existsSync);

  for (const filePath of existingEnvPaths) {
    const file = await readEnvFile(filePath);

    for (const [key, value] of Object.entries(file)) {
      environment.set(key, value);
    }
  }

  return environment;
}

export { loadEnvironment };
