import { parseEscapes } from "./utils/parse-escapes.js";

function applyEscapeSequences(environment: Map<string, string>) {
  for (const [key, val] of environment) {
    environment.set(key, parseEscapes(val));
  }
}

export { applyEscapeSequences };
