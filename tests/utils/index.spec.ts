import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../../src/utils/read-env-file.js", () => ({
  readEnvFile: vi.fn(),
}));
vi.mock("../../src/utils/build-environment-dependency-graph.js", () => ({
  buildEnvironmentDependencyGraph: vi.fn(),
}));
vi.mock("../../src/utils/extract-default-values.js", () => ({
  extractDefaultValuesFromDependencies: vi.fn(
    (dependencies: any, environment: Map<string, string>) => {
      // Minimal fake logic for defaults
      for (const key in dependencies) {
        for (const dep of dependencies[key]) {
          if (dep.dependency.includes(":-")) {
            const [name, def] = dep.dependency.split(":-");
            dep.dependency = name;
            dep.placeholder = dep.placeholder.replace(`:-${def}`, "");
            dep.defaultValue = def;
            environment.set(key, environment.get(key)!.replace(`:-${def}`, ""));
          } else {
            dep.defaultValue = "";
          }
        }
      }
      return dependencies;
    }
  ),
}));

import { config } from "../../src/index.js";
import { readEnvFile } from "../../src/utils/read-env-file.js";
import { buildEnvironmentDependencyGraph } from "../../src/utils/build-environment-dependency-graph.js";

describe("config", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Clear process.env
    for (const key of [
      "HOST",
      "PORT",
      "URL",
      "FULL_URL",
      "API_KEY",
      "TOKEN",
      "DB_HOST",
      "DB_PORT",
      "SERVICE_URL",
    ]) {
      delete process.env[key];
    }
  });

  it("resolves variables in the correct topological order", async () => {
    (readEnvFile as any).mockResolvedValue({
      HOST: "localhost",
      PORT: "3000",
      URL: "http://${HOST}:${PORT}",
      FULL_URL: "${URL}/api",
    });
    (buildEnvironmentDependencyGraph as any).mockImplementation(() => ({
      HOST: [],
      PORT: [],
      URL: [
        { dependency: "HOST", placeholder: "${HOST}" },
        { dependency: "PORT", placeholder: "${PORT}" },
      ],
      FULL_URL: [{ dependency: "URL", placeholder: "${URL}" }],
    }));

    const env = await config();

    expect(env.get("HOST")).toBe("localhost");
    expect(env.get("PORT")).toBe("3000");
    expect(env.get("URL")).toBe("http://localhost:3000");
    expect(env.get("FULL_URL")).toBe("http://localhost:3000/api");
  });

  it("handles variables with no dependencies", async () => {
    (readEnvFile as any).mockResolvedValue({ HOST: "localhost", PORT: "3000" });
    (buildEnvironmentDependencyGraph as any).mockImplementation(() => ({
      HOST: [],
      PORT: [],
    }));

    const env = await config();

    expect(env.get("HOST")).toBe("localhost");
    expect(env.get("PORT")).toBe("3000");
  });

  it("supports multiple independent variables", async () => {
    (readEnvFile as any).mockResolvedValue({
      A: "1",
      B: "2",
      C: "3",
    });
    (buildEnvironmentDependencyGraph as any).mockImplementation(() => ({
      A: [],
      B: [],
      C: [],
    }));

    const env = await config();
    expect(env.get("A")).toBe("1");
    expect(env.get("B")).toBe("2");
    expect(env.get("C")).toBe("3");
  });

  it("handles a single variable depending on another", async () => {
    (readEnvFile as any).mockResolvedValue({
      X: "value",
      Y: "${X}-suffix",
    });
    (buildEnvironmentDependencyGraph as any).mockImplementation(() => ({
      X: [],
      Y: [{ dependency: "X", placeholder: "${X}" }],
    }));

    const env = await config();
    expect(env.get("Y")).toBe("value-suffix");
  });

  it("handles multiple dependencies for a single variable", async () => {
    (readEnvFile as any).mockResolvedValue({
      H: "host",
      P: "8080",
      URL: "http://${H}:${P}",
    });
    (buildEnvironmentDependencyGraph as any).mockImplementation(() => ({
      H: [],
      P: [],
      URL: [
        { dependency: "H", placeholder: "${H}" },
        { dependency: "P", placeholder: "${P}" },
      ],
    }));

    const env = await config();
    expect(env.get("URL")).toBe("http://host:8080");
  });

  it("supports nested dependencies", async () => {
    (readEnvFile as any).mockResolvedValue({
      A: "foo",
      B: "${A}-bar",
      C: "${B}-baz",
    });
    (buildEnvironmentDependencyGraph as any).mockImplementation(() => ({
      A: [],
      B: [{ dependency: "A", placeholder: "${A}" }],
      C: [{ dependency: "B", placeholder: "${B}" }],
    }));

    const env = await config();
    expect(env.get("C")).toBe("foo-bar-baz");
  });

  it("process.env mirrors Map values", async () => {
    (readEnvFile as any).mockResolvedValue({
      HOST: "localhost",
      PORT: "3000",
      URL: "http://${HOST}:${PORT}",
    });
    (buildEnvironmentDependencyGraph as any).mockImplementation(() => ({
      HOST: [],
      PORT: [],
      URL: [
        { dependency: "HOST", placeholder: "${HOST}" },
        { dependency: "PORT", placeholder: "${PORT}" },
      ],
    }));

    await config();

    expect(process.env.HOST).toBe("localhost");
    expect(process.env.PORT).toBe("3000");
    expect(process.env.URL).toBe("http://localhost:3000");
  });

  it("keeps variables unchanged if they have no placeholders", async () => {
    (readEnvFile as any).mockResolvedValue({
      STATIC: "fixed-value",
    });
    (buildEnvironmentDependencyGraph as any).mockImplementation(() => ({
      STATIC: [],
    }));

    const env = await config();
    expect(env.get("STATIC")).toBe("fixed-value");
    expect(process.env.STATIC).toBe("fixed-value");
  });

  it("handles multiple nested variables", async () => {
    (readEnvFile as any).mockResolvedValue({
      A: "1",
      B: "${A}2",
      C: "${B}3",
      D: "${C}4",
    });
    (buildEnvironmentDependencyGraph as any).mockImplementation(() => ({
      A: [],
      B: [{ dependency: "A", placeholder: "${A}" }],
      C: [{ dependency: "B", placeholder: "${B}" }],
      D: [{ dependency: "C", placeholder: "${C}" }],
    }));

    const env = await config();
    expect(env.get("D")).toBe("1234");
  });

  it("supports variables depending on multiple levels", async () => {
    (readEnvFile as any).mockResolvedValue({
      X: "x",
      Y: "${X}y",
      Z: "${Y}z",
    });
    (buildEnvironmentDependencyGraph as any).mockImplementation(() => ({
      X: [],
      Y: [{ dependency: "X", placeholder: "${X}" }],
      Z: [{ dependency: "Y", placeholder: "${Y}" }],
    }));

    const env = await config();
    expect(env.get("Z")).toBe("xyz");
  });

  // === DEFAULT VALUE TESTS ===

  it("resolves variable with a default value", async () => {
    (readEnvFile as any).mockResolvedValue({
      API_KEY: "${TOKEN:-abc123}",
    });
    (buildEnvironmentDependencyGraph as any).mockImplementation(() => ({
      TOKEN: [],
      API_KEY: [
        { dependency: "TOKEN:-abc123", placeholder: "${TOKEN:-abc123}" },
      ],
    }));

    const env = await config();

    expect(env.get("TOKEN")).toBe("abc123");
    expect(env.get("API_KEY")).toBe("abc123");
    expect(process.env.TOKEN).toBe("abc123");
    expect(process.env.API_KEY).toBe("abc123");
  });

  it("resolves multiple variables with defaults", async () => {
    (readEnvFile as any).mockResolvedValue({
      DB_HOST: "${HOST:-localhost}",
      DB_PORT: "${PORT:-5432}",
    });
    (buildEnvironmentDependencyGraph as any).mockImplementation(() => ({
      HOST: [],
      PORT: [],
      DB_HOST: [
        { dependency: "HOST:-localhost", placeholder: "${HOST:-localhost}" },
      ],
      DB_PORT: [{ dependency: "PORT:-5432", placeholder: "${PORT:-5432}" }],
    }));

    const env = await config();

    expect(env.get("DB_HOST")).toBe("localhost");
    expect(env.get("DB_PORT")).toBe("5432");
  });

  it("resolves nested variables using defaults", async () => {
    (readEnvFile as any).mockResolvedValue({
      SERVICE_URL: "${HOST:-localhost}:${PORT:-3000}/api",
    });
    (buildEnvironmentDependencyGraph as any).mockImplementation(() => ({
      HOST: [],
      PORT: [],
      SERVICE_URL: [
        { dependency: "HOST:-localhost", placeholder: "${HOST:-localhost}" },
        { dependency: "PORT:-3000", placeholder: "${PORT:-3000}" },
      ],
    }));

    const env = await config();

    expect(env.get("SERVICE_URL")).toBe("localhost:3000/api");
  });

  it("uses default if dependency is missing", async () => {
    (readEnvFile as any).mockResolvedValue({
      API_KEY: "${TOKEN:-defaultKey}",
    });
    (buildEnvironmentDependencyGraph as any).mockImplementation(() => ({
      TOKEN: [],
      API_KEY: [
        {
          dependency: "TOKEN:-defaultKey",
          placeholder: "${TOKEN:-defaultKey}",
        },
      ],
    }));

    const env = await config();

    expect(env.get("API_KEY")).toBe("defaultKey");
  });
});
