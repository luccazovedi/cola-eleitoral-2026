const GENERAL_ELECTION_2026_ID = "20322002026";

function candidatePhotoUrl(uf: string, candidateId: string): string {
  return `https://divulgacandcontas.tse.jus.br/divulga/rest/arquivo/img/${GENERAL_ELECTION_2026_ID}/${candidateId}/${uf.toUpperCase()}`;
}

export async function loadCandidatePhotoUrls(uf: string, candidateIds: string[]): Promise<Record<string, string>> {
  return Object.fromEntries(
    candidateIds.map((candidateId) => [candidateId, candidatePhotoUrl(uf, candidateId)]),
  );
}
