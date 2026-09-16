import { unzipSync } from "fflate";

export const TSE_CANDIDATES_DATASET_URL = "https://dadosabertos.tse.jus.br/dataset/candidatos-2026";
export const TSE_CANDIDATES_RESOURCE_URL =
  "https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_2026.zip";

export function decodeCandidateCsvFromZip(buffer: ArrayBuffer, uf?: string): string {
  const files = unzipSync(new Uint8Array(buffer));
  const entries = Object.entries(files);
  const normalizedUf = uf?.toUpperCase();
  const expectedFile = normalizedUf ? new RegExp(`consulta_cand_2026_${normalizedUf}\\.csv$`, "i") : null;
  const candidateEntry =
    (expectedFile ? entries.find(([name]) => expectedFile.test(name)) : undefined) ??
    entries.find(([name]) => /consulta_cand.*\.csv$/i.test(name)) ??
    entries.find(([name]) => name.toLocaleLowerCase("pt-BR").endsWith(".csv"));

  if (!candidateEntry) {
    throw new Error("O arquivo oficial do TSE não contém o CSV de candidatos esperado.");
  }

  return new TextDecoder("iso-8859-1").decode(candidateEntry[1]);
}
