import { candidateMatchesFilters } from "@/lib/tse/normalize";
import type { Candidate, CandidateFilters, CandidateSearchResult } from "@/types/candidate";

const TSE_CANDIDATES_DATASET_URL = "https://dadosabertos.tse.jus.br/dataset/candidatos-2026";
const TSE_CANDIDATES_RESOURCE_URL =
  "https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_2026.zip";
const candidateCache = new Map<string, Promise<Candidate[]>>();

type CandidateTuple = [string, Candidate["office"], string, string, string, string, string];
type CandidateMirror = { updatedAt: string | null; candidates: CandidateTuple[] };
const updatedAtCache = new Map<string, string | null>();

async function loadCandidates(uf: string): Promise<Candidate[]> {
  const normalizedUf = uf.toUpperCase();
  const cached = candidateCache.get(normalizedUf);

  if (cached) {
    return cached;
  }

  const request = fetch(`/data/candidates/${normalizedUf}.json`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("O espelho local de candidatos não está disponível. Tente novamente em alguns instantes.");
      }
      return response.json() as Promise<CandidateMirror>;
    })
    .then((mirror) => {
      updatedAtCache.set(normalizedUf, mirror.updatedAt);
      return mirror.candidates.map(([id, office, number, ballotName, fullName, party, status]) => ({
        id,
        uf: normalizedUf,
        office,
        officeLabel: office,
        number,
        ballotName,
        fullName,
        party,
        status,
        sourceUpdatedAt: mirror.updatedAt,
      }));
    });

  candidateCache.set(normalizedUf, request);
  return request;
}

export async function searchCandidatesFromLocalMirror(filters: CandidateFilters): Promise<CandidateSearchResult> {
  const normalizedUf = filters.uf?.toUpperCase() ?? "BR";
  const allCandidates = await loadCandidates(normalizedUf);
  const limit = Math.min(Math.max(filters.limit ?? 100, 1), 200);
  const candidates = allCandidates.filter((candidate) => candidateMatchesFilters(candidate, filters));

  return {
    source: {
      datasetName: "Candidatos - 2026",
      datasetUrl: TSE_CANDIDATES_DATASET_URL,
      resourceName: "Candidatos",
      resourceUrl: TSE_CANDIDATES_RESOURCE_URL,
      updatedAt: updatedAtCache.get(normalizedUf) ?? allCandidates[0]?.sourceUpdatedAt ?? null,
    },
    filters: { ...filters, uf: filters.uf?.toUpperCase(), limit },
    total: candidates.length,
    candidates: candidates.slice(0, limit),
  };
}
