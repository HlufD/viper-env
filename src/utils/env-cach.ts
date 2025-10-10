import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs";

interface CacheEntry<T> {
  hash: string;
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();

function hashFile(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

function cachedReadFile<T>(
  filePath: string,
  parser: (content: string) => T,
  ttlMs: number = 60_000
): T {
  const now = Date.now();
  const fullPath = path.resolve(filePath);

  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${fullPath}`);
  }

  const content = fs.readFileSync(fullPath, "utf-8");
  const hash = hashFile(content);
  const cached = cache.get(fullPath);

  if (cached && cached.hash === hash && now - cached.timestamp < ttlMs) {
    return cached.data;
  }

  const data = parser(content);
  cache.set(fullPath, { hash, data, timestamp: now });

  return data;
}

export { hashFile, cachedReadFile };
