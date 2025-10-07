import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readEnvFile } from "../src/utils/read-env-file.js";
import { loadEnvironment } from "../src/load-environment.js";
import fs from "node:fs";
import path from "node:path";

// Mock readEnvFile
vi.mock("../src/utils/read-env-file.js", () => ({
  readEnvFile: vi.fn(),
}));

describe("loadEnvironment", () => {
  let envMap: Map<string, string>;
  let existsSyncSpy: any;
  let consoleWarnSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    envMap = new Map();
    vi.clearAllMocks();

    // Mock console methods
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => { });
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => { });

    // Default mock for existsSync
    existsSyncSpy = vi.spyOn(fs, "existsSync").mockReturnValue(true);
  });

  afterEach(() => {
    existsSyncSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it("should load default .env file when no options provided", async () => {
    (readEnvFile as any).mockResolvedValue({ PORT: "3000", HOST: "localhost" });

    const result = await loadEnvironment(envMap);

    expect(result).toBeInstanceOf(Map);
    expect(result.get("PORT")).toBe("3000");
    expect(result.get("HOST")).toBe("localhost");
  });

  it("should read a custom env file and populate the Map", async () => {
    (readEnvFile as any).mockResolvedValue({ PORT: "3000", HOST: "localhost" });

    const result = await loadEnvironment(envMap, { customFilePath: ".env.custom" });

    expect(result).toBeInstanceOf(Map);
    expect(result.get("PORT")).toBe("3000");
    expect(result.get("HOST")).toBe("localhost");
  });

  it("should return an empty Map if the env file is empty", async () => {
    (readEnvFile as any).mockResolvedValue({});

    const result = await loadEnvironment(envMap, { customFilePath: ".env" });

    expect(result.size).toBe(0);
  });

  it("should warn and return the same Map if custom path is outside cwd", async () => {
    const outsidePath = "/tmp/.env";
    const result = await loadEnvironment(envMap, {
      customFilePath: outsidePath,
      debug: true
    });

    expect(result).toBe(envMap);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("outside the project directory")
    );
  });

  it("should warn if custom file does not start with .env", async () => {
    const invalidFile = "config.txt";
    const result = await loadEnvironment(envMap, {
      customFilePath: invalidFile,
      debug: true
    });

    expect(result).toBe(envMap);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('does not start with ".env"')
    );
  });

  it("should warn if custom file does not exist", async () => {
    existsSyncSpy.mockReturnValue(false);

    const fakeFile = ".env.fake";
    const result = await loadEnvironment(envMap, {
      customFilePath: fakeFile,
      debug: true
    });

    expect(result).toBe(envMap);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("does not exist")
    );
  });

  it("should load all default env files when loadAllDefaults is true", async () => {
    const defaultEnvFiles = [
      ".env",
      ".env.local",
      `.env.${process.env.NODE_ENV || "development"}`,
      `.env.${process.env.NODE_ENV || "development"}.local`,
    ];

    let callCount = 0;
    (readEnvFile as any).mockImplementation(async () => {
      callCount++;
      return { [`VAR${callCount}`]: `value${callCount}` };
    });

    const result = await loadEnvironment(envMap, { loadAllDefaults: true });

    expect(result.size).toBe(defaultEnvFiles.length);
    expect(fs.existsSync).toHaveBeenCalledTimes(defaultEnvFiles.length);
    expect(readEnvFile).toHaveBeenCalledTimes(defaultEnvFiles.length);
  });

  it("should read only existing default env files when no custom path is provided", async () => {
    existsSyncSpy.mockImplementation((filePath: any) => {
      const strPath = filePath.toString();
      return strPath.endsWith(".env") || strPath.endsWith(".env.local");
    });

    let readCallCount = 0;
    (readEnvFile as any).mockImplementation(async (filePath: string) => {
      readCallCount++;
      const key = `VAR${readCallCount}`;
      return { [key]: `value${readCallCount}` };
    });

    const result = await loadEnvironment(envMap);

    expect(result.size).toBe(1);
    expect(readEnvFile).toHaveBeenCalledTimes(1);
    expect(readEnvFile).toHaveBeenCalledWith(path.resolve(process.cwd(), ".env"));
  })

  it("should merge multiple env files, last value wins for duplicate keys", async () => {
    (readEnvFile as any)
      .mockResolvedValueOnce({ VAR: "1", COMMON: "A" })
      .mockResolvedValueOnce({ VAR: "2", OTHER: "B", COMMON: "B" });

    const result = await loadEnvironment(envMap, { loadAllDefaults: true });

    expect(result.get("VAR")).toBe("2"); // last file wins
    expect(result.get("COMMON")).toBe("B"); // last file wins
    expect(result.get("OTHER")).toBe("B");
  });

  it("should keep existing keys in the Map if new files don't override them", async () => {
    envMap.set("EXISTING", "keepme");

    (readEnvFile as any).mockResolvedValue({ NEW: "value" });

    const result = await loadEnvironment(envMap, { customFilePath: ".env" });

    expect(result.get("EXISTING")).toBe("keepme");
    expect(result.get("NEW")).toBe("value");
  });

  it("should handle debug mode and log warnings", async () => {
    existsSyncSpy.mockReturnValue(false);

    await loadEnvironment(envMap, {
      customFilePath: ".env.nonexistent",
      debug: true
    });

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("does not exist")
    );
  });

  it("should handle errors when reading env files gracefully", async () => {
    (readEnvFile as any).mockRejectedValue(new Error("File read error"));

    const result = await loadEnvironment(envMap, {
      customFilePath: ".env",
      debug: true
    });

    expect(result).toBe(envMap);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('Failed to read')
    );
  });

  it("should warn when no environment files are found", async () => {
    existsSyncSpy.mockReturnValue(false);

    const result = await loadEnvironment(envMap, { debug: true });

    expect(result).toBe(envMap);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("No environment files found to load")
    );
  });

  it("should handle unexpected errors gracefully", async () => {
    existsSyncSpy.mockImplementation(() => {
      throw new Error("Unexpected filesystem error");
    });

    const result = await loadEnvironment(envMap, { debug: true });

    expect(result).toBe(envMap);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("Unexpected error loading environment")
    );
  });

  it("should prioritize customFilePath over loadAllDefaults when both are provided", async () => {
    existsSyncSpy.mockImplementation((filePath: any) => {
      const pathStr = filePath.toString();
      console.log('existsSync called with:', pathStr);
      return pathStr.endsWith(".env.custom");
    });

    const mockedReadEnvFile = vi.mocked(readEnvFile);
    mockedReadEnvFile.mockResolvedValue({ CUSTOM: "value" });

    console.log('Calling loadEnvironment...');
    const result = await loadEnvironment(envMap, {
      customFilePath: ".env.custom",
      loadAllDefaults: true
    });

    expect(result.get("CUSTOM")).toBe("value");
    expect(mockedReadEnvFile).toHaveBeenCalledTimes(1);
  });

  it("should resolve paths relative to current working directory", async () => {
    (readEnvFile as any).mockResolvedValue({ TEST: "value" });

    await loadEnvironment(envMap, { customFilePath: ".env.test" });

    // Verify the path resolution by checking that existsSync was called
    expect(fs.existsSync).toHaveBeenCalled();
  });

  it("should handle NODE_ENV specific files correctly", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "test";

    (readEnvFile as any).mockImplementation(async (filePath: string) => {
      const baseName = path.basename(filePath);
      return { [baseName]: "loaded" };
    });

    const result = await loadEnvironment(envMap, { loadAllDefaults: true });

    // Check that we loaded the expected number of files
    expect(readEnvFile).toHaveBeenCalledTimes(4); // .env, .env.local, .env.test, .env.test.local

    process.env.NODE_ENV = originalNodeEnv;
  });

  it("should work with null customFilePath", async () => {
    (readEnvFile as any).mockResolvedValue({ DEFAULT: "value" });

    const result = await loadEnvironment(envMap, { customFilePath: null });

    expect(result.get("DEFAULT")).toBe("value");
  });

  it("should handle files that exist but fail security checks", async () => {
    // Test path outside cwd
    const outsidePath = "../outside/.env";
    const result = await loadEnvironment(envMap, {
      customFilePath: outsidePath,
      debug: true
    });

    expect(result).toBe(envMap);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("outside the project directory")
    );
  });

  it("should handle files with correct .env prefix but outside cwd", async () => {
    const outsideEnv = "/tmp/.env.config";
    const result = await loadEnvironment(envMap, {
      customFilePath: outsideEnv,
      debug: true
    });

    expect(result).toBe(envMap);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("outside the project directory")
    );
  });

  it("should not warn when debug is false", async () => {
    existsSyncSpy.mockReturnValue(false);

    const result = await loadEnvironment(envMap, {
      customFilePath: ".env.nonexistent",
      debug: false
    });

    expect(result).toBe(envMap);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("should handle custom file path that resolves to current directory", async () => {
    (readEnvFile as any).mockResolvedValue({ TEST: "value" });

    const result = await loadEnvironment(envMap, { customFilePath: ".env.test" });

    expect(result.get("TEST")).toBe("value");
  });
});