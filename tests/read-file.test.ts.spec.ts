import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { readEnvFile } from "../src/utils/read-env-file";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tempEnvPath = path.join(__dirname, "test.env");

describe("readEnvFile", () => {
  beforeAll(async () => {
    const mockEnv = `
# this is a comment
PORT=3000
API_KEY="12345"
API_KEY2='67890'

EMPTY=

INLINE=hello # comment here
SPACED = spacedValue

MULTI_VAR="This is
a multi-line
value"

SINGLE_MULTI='This is
also multi-line
value'

ESCAPED_QUOTE="He said \\"hello\\""

DB_USER_1=testuser
aKey=1
Key2=2

SPACES="   "
TRAILING_SPACE=somevalue    

# comment with leading spaces
   # spaced comment

CERT="-----BEGIN CERT-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQE...
-----END CERT-----"

CERT2="-----BEGIN CERT-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQE...
-----END CERT-----"#this is private key comment after multiline

NO_VALUE
QUOTED_WITH_HASH="value#notacomment"
ONLY_HASH=#
ONLY_HASH2='#'

BROKEN_MULTI="This never ends
`;
    await fs.writeFile(tempEnvPath, mockEnv, "utf-8");
  });

  afterAll(async () => {
    await fs.unlink(tempEnvPath);
  });

  it("should parse simple key=value pairs", async () => {
    const result = await readEnvFile(tempEnvPath);
    expect(result.PORT).toBe("3000");
    expect(result.API_KEY).toBe("12345");
    expect(result.API_KEY2).toBe("67890");
  });

  it("should parse empty values correctly", async () => {
    const result = await readEnvFile(tempEnvPath);
    expect(result.EMPTY).toBe("");
  });

  it("should handle inline comments correctly", async () => {
    const result = await readEnvFile(tempEnvPath);
    expect(result.INLINE).toBe("hello");
  });

  it("should trim spaces around keys and values", async () => {
    const result = await readEnvFile(tempEnvPath);
    expect(result.SPACED).toBe("spacedValue");
  });

  it("should handle multi-line values (double quotes)", async () => {
    const result = await readEnvFile(tempEnvPath);
    expect(result.MULTI_VAR).toBe("This isa multi-linevalue");
  });

  it("should handle multi-line values (single quotes)", async () => {
    const result = await readEnvFile(tempEnvPath);
    expect(result.SINGLE_MULTI).toBe("This isalso multi-linevalue");
  });

  it("should handle escaped quotes in values", async () => {
    const result = await readEnvFile(tempEnvPath);
    expect(result.ESCAPED_QUOTE).toBe('He said \\"hello\\"');
  });

  it("should handle keys with underscores or numbers", async () => {
    const result = await readEnvFile(tempEnvPath);
    expect(result.DB_USER_1).toBe("testuser");
  });

  it("should handle lowercase and mixed-case keys", async () => {
    const result = await readEnvFile(tempEnvPath);
    expect(result.aKey).toBe("1");
    expect(result.Key2).toBe("2");
  });

  it("should handle values with only spaces", async () => {
    const result = await readEnvFile(tempEnvPath);
    expect(result.SPACES).toBe("   ");
  });

  it("should handle trailing spaces in values", async () => {
    const result = await readEnvFile(tempEnvPath);
    expect(result.TRAILING_SPACE).toBe("somevalue");
  });

  it("should ignore comment lines with leading spaces", async () => {
    const result = await readEnvFile(tempEnvPath);
    expect(result["   # spaced comment"]).toBeUndefined();
  });

  it("should handle certificate-like multi-line values", async () => {
    const result = await readEnvFile(tempEnvPath);
    expect(result.CERT).toContain("-----BEGIN CERT-----");
    expect(result.CERT).toContain("-----END CERT-----");
  });

  it("should ignore comments after closing quotes in multi-line", async () => {
    const result = await readEnvFile(tempEnvPath);
    expect(result.CERT2).toContain("-----BEGIN CERT-----");
    expect(result.CERT2).not.toContain("#this is private key comment");
  });

  it("should ignore lines without '='", async () => {
    const result = await readEnvFile(tempEnvPath);
    expect(result.NO_VALUE).toBeUndefined();
  });

  it("should keep # inside quoted strings", async () => {
    const result = await readEnvFile(tempEnvPath);
    expect(result.QUOTED_WITH_HASH).toBe("value#notacomment");
  });

  it("should allow a key with only # as value", async () => {
    const result = await readEnvFile(tempEnvPath);
    expect(result.ONLY_HASH).toBe("");
    expect(result.ONLY_HASH2).toBe("#");
  });

  it("should handle unterminated multi-line values at EOF", async () => {
    const result = await readEnvFile(tempEnvPath);
    expect(result.BROKEN_MULTI).toBe("This never ends");
  });
});
