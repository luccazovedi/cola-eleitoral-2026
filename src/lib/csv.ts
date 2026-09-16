export type CsvRecord = Record<string, string>;

export function parseDelimited(text: string, delimiter = ";"): CsvRecord[] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === delimiter && !quoted) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(field);
      field = "";
      if (row.some((value) => value.trim().length > 0)) {
        rows.push(row);
      }
      row = [];
      continue;
    }

    field += char;
  }

  row.push(field);
  if (row.some((value) => value.trim().length > 0)) {
    rows.push(row);
  }

  const [header, ...body] = rows;
  if (!header) {
    return [];
  }

  const keys = header.map((value) => value.trim());

  return body.map((values) =>
    Object.fromEntries(keys.map((key, index) => [key, values[index]?.trim() ?? ""])),
  );
}
