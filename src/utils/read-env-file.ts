import fs from "node:fs";
import readline from "readline";
import { isCommentLine } from "./is-comment.js";
import { isKeyValueLine } from "./is-key-value-line.js";
import { removeComment } from "./remove-comment.js";
import { containsComment } from "./contains-comment.js";
import { isMultiLine } from "./is-multi-line.js";

async function readEnvFile(path: string, multiline?: boolean) {
  const readSteam = fs.createReadStream(path, { encoding: "utf-8" });

  const rl = readline.createInterface({
    input: readSteam,
    crlfDelay: Infinity,
  });

  const environment: Record<string, string> = {};
  let buffer: Record<string, string> = {};
  let curKey: string = "";

  let isMultiLineStatus = false;

  for await (const line of rl) {
    let trimmedLine = line.trim();

    // check if the line is a comment or empty
    if (isCommentLine(trimmedLine) || !trimmedLine) continue;

    //  continuation of a multiline value
    if (!isKeyValueLine(trimmedLine) && isMultiLineStatus && multiline) {
      if (containsComment(trimmedLine)) {
        trimmedLine = removeComment(trimmedLine);
      }

      buffer[curKey] += trimmedLine;

      if (trimmedLine.endsWith("'") || trimmedLine.endsWith('"')) {
        environment[curKey.trim()] = buffer[curKey.trim()]!.replace(
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

      environment[key!.trim()] = value!.trim().replace(/^["']|["']$/g, "");
    }
  }

  // save last multi-line if file ends without closing quote
  if (curKey && buffer[curKey]) {
    environment[curKey] = buffer[curKey]!.replace(/^["']|["']$/g, "");
  }

  return environment;
}

export { readEnvFile };
