import { describe, it, expect, vi, beforeEach } from "vitest";
import { readEnvFile } from "../src/utils/read-env-file.js";
import { loadEnvironment } from "../src/load-environment.js";
import fs from "node:fs";
import path from "node:path";

// Mock readEnvFile
vi.mock("../src/utils/read-env-file.js", () => ({
  readEnvFile: vi.fn(),
}));

// Mock console.warn to suppress warnings
vi.spyOn(console, "warn").mockImplementation(() => { });

describe("loadEnvironment", () => {
  let envMap: Map<string, string>;

  beforeEach(() => {
    envMap = new Map();
    vi.clearAllMocks();
  });

  it("should read a custom env file and populate the Map", async () => {
    (readEnvFile as any).mockResolvedValue({ PORT: "3000", HOST: "localhost" });

    // Mock fs.existsSync for the custom file
    vi.spyOn(fs, "existsSync").mockReturnValue(true);

    const result = await loadEnvironment(".env", envMap);

    expect(result).toBeInstanceOf(Map);
    expect(result.get("PORT")).toBe("3000");
    expect(result.get("HOST")).toBe("localhost");
  });

  it("should return an empty Map if the env file is empty", async () => {
    (readEnvFile as any).mockResolvedValue({});
    vi.spyOn(fs, "existsSync").mockReturnValue(true);

    const result = await loadEnvironment(".env", envMap);

    expect(result.size).toBe(0);
  });

  it("should warn and return the same Map if custom path is outside cwd", async () => {
    const outsidePath = "/tmp/.env";
    const result = await loadEnvironment(outsidePath, envMap);

    expect(result).toBe(envMap);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("outside project directory")
    );
  });

  it("should warn if custom file does not start with .env", async () => {
    const invalidFile = "config.txt";
    const result = await loadEnvironment(invalidFile, envMap);

    expect(result).toBe(envMap);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('does not start with ".env"')
    );
  });

  it("should warn if custom file does not exist", async () => {
    const fakeFile = ".env.fake";
    vi.spyOn(fs, "existsSync").mockReturnValue(false);

    const result = await loadEnvironment(fakeFile, envMap);

    expect(result).toBe(envMap);
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("does not exist")
    );
  });

  it("should read only existing default env files when no custom path is provided", async () => {
    const existingFiles = [".env", ".env.local"];
    vi.spyOn(fs, "existsSync").mockImplementation((filePath: any) =>
      existingFiles.some((f) => filePath.endsWith(f))
    );

    // Each file returns a unique key for deterministic Map size
    (readEnvFile as any).mockImplementation(async (filePath: string) => {
      const key = path.basename(filePath).replace(".", "").toUpperCase();
      return { [key]: key + "_VALUE" };
    });

    const result = await loadEnvironment(null, envMap);

    expect(result.size).toBe(existingFiles.length);
    existingFiles.forEach((file) => {
      const key = file.replace(".", "").toUpperCase();
      expect(result.get(key)).toBe(key + "_VALUE");
    });
  });

  it("should merge multiple env files, last value wins for duplicate keys", async () => {
    vi.spyOn(fs, "existsSync").mockReturnValue(true);

    (readEnvFile as any)
      .mockResolvedValueOnce({ VAR: "1", COMMON: "A" })
      .mockResolvedValueOnce({ VAR: "2", OTHER: "B", COMMON: "B" });

    const result = await loadEnvironment(null, envMap);

    expect(result.get("VAR")).toBe("2"); // last file wins
    expect(result.get("COMMON")).toBe("B"); // last file wins
    expect(result.get("OTHER")).toBe("B");
  });

  it("should keep existing keys in the Map if new files don't override them", async () => {
    envMap.set("EXISTING", "keepme");

    (readEnvFile as any).mockResolvedValue({ NEW: "value" });
    vi.spyOn(fs, "existsSync").mockReturnValue(true);

    const result = await loadEnvironment(".env", envMap);

    expect(result.get("EXISTING")).toBe("keepme");
    expect(result.get("NEW")).toBe("value");
  });
});
