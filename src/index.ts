import { buildEnvironmentDependencyGraph } from "./utils/build-environment-dependency-graph.js";
import { readEnvFile } from "./utils/read-env-file.js";

const file = await readEnvFile(".env");
const environment = new Map(Object.entries(file));

console.log(environment);
