function removeComment(line: string) {
  if (line.startsWith('"')) {
    return line.slice(1, line.lastIndexOf('"')).trim();
  }

  if (line.startsWith("'")) {
    return line.slice(1, line.lastIndexOf("'")).trim();
  }
  return line.split("#")[0]!.trim();
}

export { removeComment };
