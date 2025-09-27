import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("../../src/utils/read-env-file.js", () => ({
  readEnvFile: vi.fn(),
}));
vi.mock("../../src/utils/build-environment-dependency-graph.js", () => ({
  buildEnvironmentDependencyGraph: vi.fn(),
}));

import { config } from "../../src/index.js";
import { readEnvFile } from "../../src/utils/read-env-file.js";
import { buildEnvironmentDependencyGraph } from "../../src/utils/build-environment-dependency-graph.js";

describe("config", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Clear process.env
    for (const key of ["HOST", "PORT", "URL", "FULL_URL", "API_KEY"]) {
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
});
