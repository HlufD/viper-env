import path from "node:path";
import { readEnvFile } from "./utils/read-env-file.js";
import fs from "node:fs";

const defaultEnvFiles = [
  `.env`,
  `.env.local`,
  `.env.${process.env.NODE_ENV || "development"}`,
  `.env.${process.env.NODE_ENV || "development"}.local`,
];

interface EnvLoadOptions {
  customFilePath?: string | null;
  loadAllDefaults?: boolean;
  debug?: boolean;
}

async function loadEnvironment(
  environment: Map<string, string>,
  options: EnvLoadOptions = {}
) {
  const { customFilePath = null, loadAllDefaults = false, debug = false } = options;
  const cwd = process.cwd();
  let allFiles: string[] = [];

  try {
    if (customFilePath) {
      const resolved = path.resolve(cwd, customFilePath);

      if (!resolved.startsWith(cwd)) {
        debug && console.warn(`[ENV WARN] Custom env file "${customFilePath}" is outside the project directory.`);
        return environment;
      }

      if (!path.basename(resolved).startsWith(".env")) {
        debug && console.warn(`[ENV WARN] Custom env file "${customFilePath}" does not start with ".env".`);
        return environment;
      }

      if (!fs.existsSync(resolved)) {
        debug && console.warn(`[ENV WARN] Custom env file "${customFilePath}" does not exist.`);
        return environment;
      }

      allFiles = [resolved];
    }

    else if (loadAllDefaults) {
      allFiles = defaultEnvFiles.map((f) => path.resolve(cwd, f));
    } else {
      const defaultPath = path.resolve(cwd, ".env");
      allFiles = [defaultPath];
    }

    const existingEnvPaths = allFiles.filter(fs.existsSync);

    if (existingEnvPaths.length === 0) {
      debug && console.warn(`[ENV WARN] No environment files found to load.`);
      return environment;
    }

    for (const filePath of existingEnvPaths) {
      try {
        const file = await readEnvFile(filePath);
        for (const [key, value] of Object.entries(file)) {
          environment.set(key, value);
        }
      } catch (err) {
        debug && console.warn(`[ENV WARN] Failed to read "${filePath}": ${(err as Error).message}`);
      }
    }
  } catch (err) {
    debug && console.error(`[ENV ERROR] Unexpected error loading environment: ${(err as Error).message}`);
  }

  return environment;
}

export { loadEnvironment };

