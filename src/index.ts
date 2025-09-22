import fs from "node:fs";
import readline from "readline";
import { isCommentLine } from "./utils/is-comment.js";
import { isKeyValueLine } from "./utils/is-key-value-line.js";
import { isMultiLine } from "./utils/is-multi-line.js";

async function readFile(path: string) {
  const readSteam = fs.createReadStream(path, { encoding: "utf-8" });

  const rl = readline.createInterface({
    input: readSteam,
    crlfDelay: Infinity,
  });

  const result: Record<string, string> = {};
  let buffer: Record<string, string> = {};
  let curKey: string = "";

  let isMultiLineStatus = false;

  for await (const line of rl) {
    const trimmedLine = line.trim();

    // check if the line is a comment or empty
    if (isCommentLine(trimmedLine) || !trimmedLine) {
      continue;
    }

    // check if a line is a key=value line or a continuation of a multiline
    if (!isKeyValueLine(trimmedLine) && isMultiLineStatus) {
      buffer[curKey] += trimmedLine;

      if (line.endsWith("'") || line.endsWith('"')) {
        result[curKey] = buffer[curKey]!.replace(/"/g, "");
        buffer = {};
        isMultiLineStatus = false;
      }
    }

    // check if a line is a key=value line
    if (isKeyValueLine(trimmedLine)) {
      const [key, value] = trimmedLine.split("=");
      if (key && value && isMultiLine(value)) {
        buffer[key] = value;
        curKey = key;
        isMultiLineStatus = true;
        continue;
      }

      result[key!] = value!.replace(/"/g, "");
    }
  }

  return result;
}

const result = await readFile(".env");

console.log("                                 ");
console.log("                                 ");

console.log(result);
