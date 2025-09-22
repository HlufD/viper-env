function isCommentLine(line: string) {
  return /^#.*/.test(line);
}

export { isCommentLine };
