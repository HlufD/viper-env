import { describe, it, expect, vi } from "vitest";
import { readEnvFile } from "../src/utils/read-env-file";
import { loadEnvironment } from "../src/load-environment";

vi.mock("../src/utils/read-env-file", () => ({
  readEnvFile: vi.fn(),
}));

describe("loadEnvironment", () => {
  it("should read env file and return a Map", async () => {
    (readEnvFile as any).mockResolvedValue({
      PORT: "3000",
      HOST: "localhost",
    });

    const envMap = await loadEnvironment(".env");

    expect(envMap).toBeInstanceOf(Map);
    expect(envMap.get("PORT")).toBe("3000");
    expect(envMap.get("HOST")).toBe("localhost");
  });

  it("should return an empty Map if file is empty", async () => {
    (readEnvFile as any).mockResolvedValue({});

    const envMap = await loadEnvironment(".env");
    expect(envMap.size).toBe(0);
  });
});
