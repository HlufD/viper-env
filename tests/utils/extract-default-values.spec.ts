import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { VariableDependencies } from "../../src/utils/get-variable-dependencies.js";
import { extractDefaultValuesFromDependencies } from "../../src/utils/extract-default-values.js";

describe("extractDefaultValuesFromDependencies", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("should extract default values and clean dependency/placeholder, updating environment map", () => {
    const input: VariableDependencies = {
      API_KEY: [
        { dependency: "TOKEN:-abc123", placeholder: "${TOKEN:-abc123}" },
      ],
    };
    const env = new Map([["API_KEY", "${TOKEN:-abc123}"]]);

    const result = extractDefaultValuesFromDependencies(input, env);

    expect(result.API_KEY[0]).toEqual({
      dependency: "TOKEN",
      placeholder: "${TOKEN}",
      defaultValue: "abc123",
    });
    expect(env.get("API_KEY")).toBe("${TOKEN}");
  });

  it("should leave dependencies without defaults unchanged, updating env with no change", () => {
    const input: VariableDependencies = {
      USER_ID: [{ dependency: "USER_ID", placeholder: "${USER_ID}" }],
    };
    const env = new Map([["USER_ID", "${USER_ID}"]]);

    const result = extractDefaultValuesFromDependencies(input, env);

    expect(result.USER_ID[0]).toEqual({
      dependency: "USER_ID",
      placeholder: "${USER_ID}",
      defaultValue: "",
    });
    expect(env.get("USER_ID")).toBe("${USER_ID}");
  });

  it("should handle multiple dependencies including defaults", () => {
    const input: VariableDependencies = {
      CONFIG: [
        { dependency: "HOST:-localhost", placeholder: "${HOST:-localhost}" },
        { dependency: "PORT", placeholder: "${PORT}" },
      ],
    };
    const env = new Map([["CONFIG", "${HOST:-localhost}:${PORT}"]]);

    const result = extractDefaultValuesFromDependencies(input, env);

    expect(result.CONFIG).toEqual([
      { dependency: "HOST", placeholder: "${HOST}", defaultValue: "localhost" },
      { dependency: "PORT", placeholder: "${PORT}", defaultValue: "" },
    ]);
    expect(env.get("CONFIG")).toBe("${HOST}:${PORT}");
  });

  it("should support numeric default values", () => {
    const input: VariableDependencies = {
      DB: [{ dependency: "PORT:-5432", placeholder: "${PORT:-5432}" }],
    };
    const env = new Map([["DB", "${PORT:-5432}"]]);

    const result = extractDefaultValuesFromDependencies(input, env);

    expect(result.DB[0]).toEqual({
      dependency: "PORT",
      placeholder: "${PORT}",
      defaultValue: "5432",
    });
    expect(env.get("DB")).toBe("${PORT}");
  });

  it("should support special characters in default values", () => {
    const input: VariableDependencies = {
      URL: [
        {
          dependency: "HOST:-http://localhost",
          placeholder: "${HOST:-http://localhost}",
        },
      ],
    };
    const env = new Map([["URL", "${HOST:-http://localhost}"]]);

    const result = extractDefaultValuesFromDependencies(input, env);

    expect(result.URL[0]).toEqual({
      dependency: "HOST",
      placeholder: "${HOST}",
      defaultValue: "http://localhost",
    });
    expect(env.get("URL")).toBe("${HOST}");
  });

  it("should not break when given an empty dependencies object", () => {
    const input: VariableDependencies = {};
    const env = new Map();
    const result = extractDefaultValuesFromDependencies(input, env);
    expect(result).toEqual({});
    expect(env.size).toBe(0);
  });

  it("should handle multiple environments with mixed defaults", () => {
    const input: VariableDependencies = {
      SERVICE: [
        {
          dependency: "API_URL:-https://api.com",
          placeholder: "${API_URL:-https://api.com}",
        },
      ],
      AUTH: [{ dependency: "TOKEN", placeholder: "${TOKEN}" }],
    };
    const env = new Map([
      ["SERVICE", "${API_URL:-https://api.com}"],
      ["AUTH", "${TOKEN}"],
    ]);

    const result = extractDefaultValuesFromDependencies(input, env);

    expect(result.SERVICE[0]).toEqual({
      dependency: "API_URL",
      placeholder: "${API_URL}",
      defaultValue: "https://api.com",
    });
    expect(result.AUTH[0]).toEqual({
      dependency: "TOKEN",
      placeholder: "${TOKEN}",
      defaultValue: "",
    });

    expect(env.get("SERVICE")).toBe("${API_URL}");
    expect(env.get("AUTH")).toBe("${TOKEN}");
  });

  it("should keep placeholder format intact when cleaning default", () => {
    const input: VariableDependencies = {
      PATH: [{ dependency: "DIR:-/tmp", placeholder: "${DIR:-/tmp}" }],
    };
    const env = new Map([["PATH", "${DIR:-/tmp}"]]);

    const result = extractDefaultValuesFromDependencies(input, env);

    expect(result.PATH[0].placeholder).toBe("${DIR}");
    expect(env.get("PATH")).toBe("${DIR}");
  });

  it("should not throw when dependency string is malformed", () => {
    const input: VariableDependencies = {
      BROKEN: [{ dependency: ":-oops", placeholder: "${:-oops}" }],
    };
    const env = new Map([["BROKEN", "${:-oops}"]]);

    const result = extractDefaultValuesFromDependencies(input, env);

    expect(result.BROKEN[0].defaultValue).toBe("oops");
    expect(result.BROKEN[0].dependency).toBe("");
    expect(env.get("BROKEN")).toBe("${}");
  });
});
