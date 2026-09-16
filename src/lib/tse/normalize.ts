import type { Candidate, CandidateFilters, CandidateOffice } from "@/types/candidate";
import type { CsvRecord } from "@/lib/csv";

const missingValues = new Set(["", "#NULO#", "#NE", "-1", "N/A"]);

const officeMap: Array<[CandidateOffice, string[]]> = [
  ["deputado-federal", ["DEPUTADO FEDERAL"]],
  ["deputado-estadual-distrital", ["DEPUTADO ESTADUAL", "DEPUTADO DISTRITAL"]],
  ["senador", ["SENADOR"]],
  ["governador", ["GOVERNADOR"]],
  ["presidente", ["PRESIDENTE"]],
];

export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

function clean(value: string | undefined): string {
  const normalized = value?.trim() ?? "";
  return missingValues.has(normalized.toUpperCase()) ? "" : normalized;
}

function mapOffice(value: string): CandidateOffice | null {
  const normalized = normalizeSearchText(value);
  return officeMap.find(([, labels]) => labels.some((label) => normalized.includes(label)))?.[0] ?? null;
}

function officeLabel(office: CandidateOffice): string {
  switch (office) {
    case "deputado-federal":
      return "Deputado federal";
    case "deputado-estadual-distrital":
      return "Deputado estadual ou distrital";
    case "senador":
      return "Senador";
    case "governador":
      return "Governador";
    case "presidente":
      return "Presidente";
  }
}

function generatedAt(record: CsvRecord): string | null {
  const [day, month, year] = clean(record.DT_GERACAO).split("/");
  const time = clean(record.HH_GERACAO);

  if (!day || !month || !year || !/^\d{2}:\d{2}:\d{2}$/.test(time)) {
    return null;
  }

  return `${year}-${month}-${day}T${time}-03:00`;
}

export function normalizeTseCandidate(record: CsvRecord, sourceUpdatedAt: string | null): Candidate | null {
  const office = mapOffice(clean(record.DS_CARGO));

  if (!office) {
    return null;
  }

  const id = clean(record.SQ_CANDIDATO);
  const uf = clean(record.SG_UF);
  const number = clean(record.NR_CANDIDATO);
  const ballotName = clean(record.NM_URNA_CANDIDATO);
  const fullName = clean(record.NM_CANDIDATO);

  if (!id || !uf || !number || !ballotName) {
    return null;
  }

  return {
    id,
    uf,
    office,
    officeLabel: officeLabel(office),
    number,
    ballotName,
    fullName,
    party: clean(record.SG_PARTIDO),
    status: clean(record.DS_SITUACAO_CANDIDATURA),
    sourceUpdatedAt: sourceUpdatedAt ?? generatedAt(record),
  };
}

export function candidateMatchesFilters(candidate: Candidate, filters: CandidateFilters): boolean {
  if (filters.uf && candidate.uf !== filters.uf.toUpperCase()) {
    return false;
  }

  if (filters.office && candidate.office !== filters.office) {
    return false;
  }

  if (!filters.q) {
    return true;
  }

  const query = normalizeSearchText(filters.q);
  const haystack = normalizeSearchText(
    [candidate.number, candidate.ballotName, candidate.fullName, candidate.party].join(" "),
  );

  return haystack.includes(query);
}
