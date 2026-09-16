import { parseDelimited } from "@/lib/csv";
import { decodeCandidateCsvFromZip, TSE_CANDIDATES_RESOURCE_URL } from "@/lib/tse/candidates";
import { candidateMatchesFilters, normalizeTseCandidate } from "@/lib/tse/normalize";
import type { Candidate, CandidateFilters, CandidateSearchResult } from "@/types/candidate";

const DATASET_URL = "https://dadosabertos.tse.jus.br/dataset/candidatos-2026";

function isCandidate(candidate: Candidate | null): candidate is Candidate {
  return candidate !== null;
}

export async function searchCandidatesFromTseCdn(filters: CandidateFilters): Promise<CandidateSearchResult> {
  const response = await fetch(TSE_CANDIDATES_RESOURCE_URL);

  if (!response.ok) {
    throw new Error("A fonte oficial do TSE não respondeu. Tente novamente em alguns instantes.");
  }

  const csv = decodeCandidateCsvFromZip(await response.arrayBuffer(), filters.uf);
  const limit = Math.min(Math.max(filters.limit ?? 100, 1), 200);
  const candidates = parseDelimited(csv)
    .map((record) => normalizeTseCandidate(record, null))
    .filter(isCandidate)
    .filter((candidate) => candidateMatchesFilters(candidate, filters));

  return {
    source: {
      datasetName: "Candidatos - 2026",
      datasetUrl: DATASET_URL,
      resourceName: "Candidatos",
      resourceUrl: TSE_CANDIDATES_RESOURCE_URL,
      updatedAt: null,
    },
    filters: { ...filters, uf: filters.uf?.toUpperCase(), limit },
    total: candidates.length,
    candidates: candidates.slice(0, limit),
  };
}
