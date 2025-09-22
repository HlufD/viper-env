function containsComment(line: string) {
  return /#/.test(line);
}

export { containsComment };
