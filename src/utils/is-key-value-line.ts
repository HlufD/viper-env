function isKeyValueLine(line: string) {
  return /[a-zA-Z0-9]=.*/.test(line);
}

export { isKeyValueLine };
