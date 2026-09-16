import { mkdir, writeFile } from "node:fs/promises";
import { unzipSync } from "fflate";

const SOURCE_URL = "https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_2026.zip";
const OUTPUT_DIR = new URL("../public/data/candidates/", import.meta.url);
const officeMap = new Map([
  ["DEPUTADO FEDERAL", "deputado-federal"],
  ["DEPUTADO ESTADUAL", "deputado-estadual-distrital"],
  ["DEPUTADO DISTRITAL", "deputado-estadual-distrital"],
  ["SENADOR", "senador"],
  ["GOVERNADOR", "governador"],
  ["PRESIDENTE", "presidente"],
]);

function parseDelimited(text, delimiter = ";") {
  const rows = [];
  let field = "";
  let row = [];
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field);
      field = "";
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }

  const [header, ...body] = rows;
  const keys = header.map((value) => value.trim());
  return body.map((values) => Object.fromEntries(keys.map((key, index) => [key, values[index]?.trim() ?? ""])));
}

function generatedAt(record) {
  const [day, month, year] = record.DT_GERACAO.split("/");
  return day && month && year ? `${year}-${month}-${day}T${record.HH_GERACAO}-03:00` : null;
}

function stringifyAscii(value) {
  return JSON.stringify(value).replace(/[\u007f-\uffff]/g, (character) =>
    `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`,
  );
}

const response = await fetch(SOURCE_URL);
if (!response.ok) throw new Error(`TSE respondeu ${response.status}`);

const archive = unzipSync(new Uint8Array(await response.arrayBuffer()));
await mkdir(OUTPUT_DIR, { recursive: true });

let total = 0;
for (const [filename, bytes] of Object.entries(archive)) {
  const match = filename.match(/consulta_cand_2026_([A-Z]{2})\.csv$/i);
  if (!match) continue;

  const uf = match[1].toUpperCase();
  const records = parseDelimited(new TextDecoder("windows-1252").decode(bytes));
  const candidates = records.flatMap((record) => {
    const office = officeMap.get(record.DS_CARGO);
    if (!office || !record.SQ_CANDIDATO || !record.NR_CANDIDATO || !record.NM_URNA_CANDIDATO) return [];
    return [[
      record.SQ_CANDIDATO,
      office,
      record.NR_CANDIDATO,
      record.NM_URNA_CANDIDATO,
      record.NM_CANDIDATO,
      record.SG_PARTIDO,
      ["#NULO#", "#NE", "-1"].includes(record.DS_SITUACAO_CANDIDATURA) ? "" : record.DS_SITUACAO_CANDIDATURA,
    ]];
  });

  total += candidates.length;
  await writeFile(
    new URL(`${uf}.json`, OUTPUT_DIR),
    stringifyAscii({ updatedAt: generatedAt(records[0] ?? {}), candidates }),
  );
}

console.log(`Espelho atualizado: ${total} candidaturas.`);
