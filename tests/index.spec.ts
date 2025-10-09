import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { config } from "../src/index.js";
import * as loadEnvModule from "../src/load-environment.js";
import * as escapeModule from "../src/apply-escape-sequences.js";
import * as validateModule from "../src/utils/validate-schema.js";
import * as resolveModule from "../src/resolve-dependencies.js";

describe("config function comprehensive tests", () => {
  let loadEnvSpy: any;
  let escapeSpy: any;
  let validateSpy: any;
  let resolveSpy: any;

  beforeEach(() => {
    // Mock loadEnvironment with correct signature
    loadEnvSpy = vi
      .spyOn(loadEnvModule, "loadEnvironment")
      .mockImplementation(async (env: Map<string, string>, options?: any) => {
        env.set("TEST_VAR", "123");
        return env;
      });

    escapeSpy = vi.spyOn(escapeModule, "applyEscapeSequences");

    validateSpy = vi
      .spyOn(validateModule, "validateSchema")
      .mockImplementation((_schema, _env) => {
        // no-op
      });

    resolveSpy = vi.spyOn(resolveModule, "resolveDependencies");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads environment variables", async () => {
    const env = await config(null);
    expect(env.get("TEST_VAR")).toBe("123");
    expect(loadEnvSpy).toHaveBeenCalled();
  });

  it("applies escape sequences", async () => {
    loadEnvSpy.mockImplementationOnce(
      async (env: Map<string, string>, options?: any) => {
        env.set("NEWLINE", "line1\\nline2");
        env.set("TAB", "col1\\tcol2");
        return env;
      }
    );

    const env = await config(null);
    expect(env.get("NEWLINE")).toBe("line1\nline2");
    expect(env.get("TAB")).toBe("col1\tcol2");
    expect(escapeSpy).toHaveBeenCalledWith(expect.any(Map));
  });

  it("applies multiple escape sequences in one variable", async () => {
    loadEnvSpy.mockImplementationOnce(
      async (env: Map<string, string>, options?: any) => {
        env.set("COMPLEX", "\\nStart\\tMiddle\\nEnd");
        return env;
      }
    );

    const env = await config(null);
    expect(env.get("COMPLEX")).toBe("\nStart\tMiddle\nEnd");
  });

  it("calls validateSchema if schema is provided", async () => {
    const schema = { TEST_VAR: { type: "number", required: true } };
    await config({ schema });

    expect(validateSpy).toHaveBeenCalledWith(expect.any(Map), { schema });
  });
  it("returns environment map", async () => {
    const env = await config(null);
    expect(env).toBeInstanceOf(Map);
    expect(env.get("TEST_VAR")).toBe("123");
  });

  it("handles variable referencing another variable", async () => {
    loadEnvSpy.mockImplementationOnce(
      async (env: Map<string, string>, options?: any) => {
        env.set("TEST_VAR", "123");
        env.set("A", "${TEST_VAR}");
        return env;
      }
    );

    const env = await config({ expand: true });
    expect(env.get("A")).toBe("123");
  });

  it("handles variable referencing itself gracefully", async () => {
    loadEnvSpy.mockImplementationOnce(
      async (env: Map<string, string>, options?: any) => {
        env.set("SELF", "${SELF}");
        return env;
      }
    );

    await expect(config(null)).rejects.toThrow("Cycle detected at node SELF");
  });

  it("handles placeholders that resolve to empty string", async () => {
    loadEnvSpy.mockImplementationOnce(
      async (env: Map<string, string>, options?: any) => {
        env.set("EMPTY", "${UNKNOWN}");
        return env;
      }
    );

    const env = await config({ expand: true });
    expect(env.get("EMPTY")).toBe("");
  });

  it("handles multiple unresolved placeholders in same string", async () => {
    loadEnvSpy.mockImplementationOnce(
      async (env: Map<string, string>, options?: any) => {
        env.set("MULTI", "${X}${Y}${Z}");
        return env;
      }
    );

    const env = await config({ expand: true });
    expect(env.get("MULTI")).toBe("");
  });

  it("handles multiple levels of unresolved variables", async () => {
    loadEnvSpy.mockImplementationOnce(
      async (env: Map<string, string>, options?: any) => {
        env.set("A", "${B}");
        env.set("B", "${C}");
        return env;
      }
    );

    const env = await config({ expand: true });
    expect(env.get("A")).toBe("");
    expect(env.get("B")).toBe("");
  });

  it("resolves multiple references correctly", async () => {
    loadEnvSpy.mockImplementationOnce(
      async (env: Map<string, string>, options?: any) => {
        env.set("X", "1");
        env.set("Y", "2");
        env.set("Z", "${X}${Y}");
        return env;
      }
    );

    const env = await config({ expand: true });
    expect(env.get("Z")).toBe("12");
  });

  it("resolves nested references", async () => {
    loadEnvSpy.mockImplementationOnce(
      async (env: Map<string, string>, options?: any) => {
        env.set("A", "a");
        env.set("B", "${A}b");
        env.set("C", "${B}c");
        return env;
      }
    );

    const env = await config({ expand: true });
    expect(env.get("C")).toBe("abc");
  });

  it("resolves references with multiple variables", async () => {
    loadEnvSpy.mockImplementationOnce(
      async (env: Map<string, string>, options?: any) => {
        env.set("A", "a");
        env.set("B", "b");
        env.set("C", "${A}${B}");
        return env;
      }
    );

    const env = await config({ expand: true });
    expect(env.get("C")).toBe("ab");
  });

  it("handles empty environment gracefully", async () => {
    loadEnvSpy.mockImplementationOnce(
      async (env: Map<string, string>, options?: any) => {
        return env; // No variables set
      }
    );

    const env = await config(null);
    expect(env.size).toBe(0);
  });

  it("handles variables with no placeholders", async () => {
    loadEnvSpy.mockImplementationOnce(
      async (env: Map<string, string>, options?: any) => {
        env.set("FOO", "bar");
        return env;
      }
    );

    const env = await config(null);
    expect(env.get("FOO")).toBe("bar");
  });

  it("handles mix of resolved and unresolved placeholders", async () => {
    loadEnvSpy.mockImplementationOnce(
      async (env: Map<string, string>, options?: any) => {
        env.set("X", "1");
        env.set("Y", "${X}${Z}");
        return env;
      }
    );

    const env = await config({ expand: true });
    expect(env.get("Y")).toBe("1");
  });

  it("resolves chained nested references", async () => {
    loadEnvSpy.mockImplementationOnce(
      async (env: Map<string, string>, options?: any) => {
        env.set("A", "a");
        env.set("B", "${A}");
        env.set("C", "${B}");
        env.set("D", "${C}");
        return env;
      }
    );

    const env = await config({ expand: true });
    expect(env.get("D")).toBe("a");
  });

  it("handles variables with spaces and special characters", async () => {
    loadEnvSpy.mockImplementationOnce(
      async (env: Map<string, string>, options?: any) => {
        env.set("SPACE", "a b");
        env.set("SPECIAL", "@!$%^&*()");
        return env;
      }
    );

    const env = await config({ expand: true });
    expect(env.get("SPACE")).toBe("a b");
    expect(env.get("SPECIAL")).toBe("@!$%^&*()");
  });

  it("resolves variables referencing multiple other variables including some missing", async () => {
    loadEnvSpy.mockImplementationOnce(
      async (env: Map<string, string>, options?: any) => {
        env.set("A", "a");
        env.set("B", "b");
        env.set("C", "${A}${B}${D}");
        return env;
      }
    );

    const env = await config({ expand: true });
    expect(env.get("C")).toBe("ab");
  });

  it("applies escape sequences after load with placeholders", async () => {
    loadEnvSpy.mockImplementationOnce(
      async (env: Map<string, string>, options?: any) => {
        env.set("TEST_VAR", "123");
        env.set("NEW", "line\\n${TEST_VAR}");
        return env;
      }
    );

    escapeSpy.mockImplementation((env: Map<string, string>) => {
      for (const [key, val] of env) {
        env.set(key, val.replace(/\\n/g, "\n").replace(/\\t/g, "\t"));
      }
    });

    const env = await config({ expand: true });
    expect(env.get("NEW")).toBe("line\n123");
  });

  it("handles very large number of chained references", async () => {
    loadEnvSpy.mockImplementationOnce(
      async (env: Map<string, string>, options?: any) => {
        let prev = "VAL0";
        env.set(prev, "0");
        for (let i = 1; i <= 50; i++) {
          const key = `VAL${i}`;
          env.set(key, `\${VAL${i - 1}}${i}`);
          prev = key;
        }
        return env;
      }
    );

    const env = await config({ expand: true });
    expect(env.get("VAL50")).toBe(
      "01234567891011121314151617181920212223242526272829303132333435363738394041424344454647484950"
    );
  });
});
