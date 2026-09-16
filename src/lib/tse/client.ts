import { parseDelimited } from "@/lib/csv";
import { candidateMatchesFilters, normalizeTseCandidate } from "@/lib/tse/normalize";
import {
  decodeCandidateCsvFromZip,
  TSE_CANDIDATES_DATASET_URL,
  TSE_CANDIDATES_RESOURCE_URL,
} from "@/lib/tse/resources";
import type { Candidate, CandidateFilters, CandidateSearchResult } from "@/types/candidate";

const candidateCache = new Map<string, Promise<Candidate[]>>();

function isCandidate(candidate: Candidate | null): candidate is Candidate {
  return candidate !== null;
}

async function loadCandidates(uf: string): Promise<Candidate[]> {
  const normalizedUf = uf.toUpperCase();
  const cached = candidateCache.get(normalizedUf);

  if (cached) {
    return cached;
  }

  const request = fetch(TSE_CANDIDATES_RESOURCE_URL)
    .then((response) => {
      if (!response.ok) {
        throw new Error("A fonte oficial do TSE não respondeu. Tente novamente em alguns instantes.");
      }
      return response.arrayBuffer();
    })
    .then((buffer) =>
      parseDelimited(decodeCandidateCsvFromZip(buffer, normalizedUf))
        .map((record) => normalizeTseCandidate(record, null))
        .filter(isCandidate),
    );

  candidateCache.set(normalizedUf, request);
  return request;
}

export async function searchCandidatesFromTseCdn(filters: CandidateFilters): Promise<CandidateSearchResult> {
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
      updatedAt: allCandidates[0]?.sourceUpdatedAt ?? null,
    },
    filters: { ...filters, uf: filters.uf?.toUpperCase(), limit },
    total: candidates.length,
    candidates: candidates.slice(0, limit),
  };
}
