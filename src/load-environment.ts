import path from "node:path";
import { readEnvFile } from "./utils/read-env-file.js";
import fs from "node:fs";
import type { EnvConfigOptions } from "./types/options.js";

const defaultEnvFiles = [
  `.env`,
  `.env.local`,
  `.env.${process.env.NODE_ENV || "development"}`,
  `.env.${process.env.NODE_ENV || "development"}.local`,
];

async function loadEnvironment(
  environment: Map<string, string>,
  options: EnvConfigOptions = {}
) {
  const {
    path: customFilePath = null,
    loadAllDefaults = false,
    debug = false,
    override = true,
    multiline = false,
  } = options;
  const cwd = process.cwd();
  let allFiles: string[] = [];

  try {
    if (customFilePath) {
      const resolved = path.resolve(cwd, customFilePath);

      if (!resolved.startsWith(cwd)) {
        debug &&
          console.warn(
            `[ENV WARN] Custom env file "${customFilePath}" is outside the project directory.`
          );
        return environment;
      }

      if (!path.basename(resolved).startsWith(".env")) {
        debug &&
          console.warn(
            `[ENV WARN] Custom env file "${customFilePath}" does not start with ".env".`
          );
        return environment;
      }

      if (!fs.existsSync(resolved)) {
        debug &&
          console.warn(
            `[ENV WARN] Custom env file "${customFilePath}" does not exist.`
          );
        return environment;
      }

      allFiles = [resolved];
    } else if (loadAllDefaults) {
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
        const file = await readEnvFile(filePath, multiline);
        for (const [key, value] of Object.entries(file)) {
          if (environment.get(key) && !override) continue;
          environment.set(key, value);
        }
      } catch (err) {
        debug &&
          console.warn(
            `[ENV WARN] Failed to read "${filePath}": ${(err as Error).message}`
          );
      }
    }
  } catch (err) {
    debug &&
      console.error(
        `[ENV ERROR] Unexpected error loading environment: ${(err as Error).message}`
      );
  }

  return environment;
}

export { loadEnvironment };
