function isKeyValueLine(line: string) {
  return /^[a-zA-Z0-9_]+ *?=/.test(line);
}

export { isKeyValueLine };
