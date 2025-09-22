function isMultiLine(line: string) {
  return /^'([^']*)$/.test(line) || /^"([^"]*)$/.test(line);
}

export { isMultiLine };
