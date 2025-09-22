import fs from "node:fs";
import readline from "readline";
import { isCommentLine } from "./utils/is-comment.js";
import { isKeyValueLine } from "./utils/is-key-value-line.js";
import { isMultiLine } from "./utils/is-multi-line.js";
import { containsComment } from "./utils/contains-comment.js";
import { removeComment } from "./utils/remove-comment.js";

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
    let trimmedLine = line.trim();

    // check if the line is a comment or empty
    if (isCommentLine(trimmedLine) || !trimmedLine) continue;

    //  continuation of a multiline value
    if (!isKeyValueLine(trimmedLine) && isMultiLineStatus) {
      if (containsComment(trimmedLine)) {
        trimmedLine = removeComment(trimmedLine);
      }

      buffer[curKey] += trimmedLine;

      if (trimmedLine.endsWith("'") || trimmedLine.endsWith('"')) {
        result[curKey.trim()] = buffer[curKey.trim()]!.replace(
          /^["']|["']$/g,
          ""
        );
        buffer = {};
        isMultiLineStatus = false;
      }

      continue;
    }

    // check if a line is a key=value line
    if (isKeyValueLine(trimmedLine)) {
      let [key, value] = trimmedLine.split("=");
      if (containsComment(value as string)) {
        value = removeComment(value as string);
      }

      if (key && value && isMultiLine(value)) {
        buffer[key.trim()] = value.trim();
        curKey = key;
        isMultiLineStatus = true;
        continue;
      }

      result[key!.trim()] = value!.trim().replace(/^["']|["']$/g, "");
    }
  }

  // save last multi-line if file ends without closing quote
  if (curKey && buffer[curKey]) {
    result[curKey] = buffer[curKey]!.replace(/^["']|["']$/g, "");
  }

  return result;
}

const result = await readFile(".env");

export { readFile };
