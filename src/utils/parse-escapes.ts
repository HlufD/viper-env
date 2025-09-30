const ESCAPE_SEQUENCES: Record<string, string> = {
  n: "\n",
  r: "\r",
  t: "\t",
  b: "\b",
  f: "\f",
  '"': '"',
  "'": "'",
  "\\": "\\",
  $: "$",
};

function parseEscapes(envString: string) {
  return envString.replace(/\\(u[0-9A-Fa-f]{4}|.)/g, (_, esc: string) => {
    if (esc.startsWith("u")) {
      const hex = esc.slice(1);
      if (/^[0-9A-Fa-f]{4}$/.test(hex)) {
        return String.fromCharCode(parseInt(hex, 16));
      }
      return esc;
    }
    return ESCAPE_SEQUENCES[esc] ?? esc;
  });
}

export { parseEscapes };
