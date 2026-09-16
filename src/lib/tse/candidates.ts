import { unzipSync } from "fflate";
import { parseDelimited } from "@/lib/csv";
import { candidateMatchesFilters, normalizeTseCandidate } from "@/lib/tse/normalize";
import type { CandidateFilters, CandidateSearchResult, CandidateSource } from "@/types/candidate";

const TSE_CANDIDATES_DATASET_ID = "candidatos-2026";
const TSE_CKAN_PACKAGE_URL = `https://dadosabertos.tse.jus.br/api/3/action/package_show?id=${TSE_CANDIDATES_DATASET_ID}`;
const TSE_CANDIDATES_DATASET_URL = "https://dadosabertos.tse.jus.br/dataset/candidatos-2026";
const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 200;

type CkanResource = {
  name?: string;
  format?: string;
  url?: string;
  last_modified?: string | null;
  metadata_modified?: string | null;
  created?: string | null;
};

type CkanPackage = {
  title?: string;
  metadata_modified?: string | null;
  resources?: CkanResource[];
};

type CkanPackageResponse = {
  success: boolean;
  result?: CkanPackage;
};

function isCandidateResource(resource: CkanResource): boolean {
  const name = resource.name?.toLocaleLowerCase("pt-BR") ?? "";
  const format = resource.format?.toUpperCase() ?? "";

  return Boolean(
    resource.url &&
      format.includes("CSV") &&
      name.includes("candidato") &&
      !name.includes("complement") &&
      !name.includes("bens") &&
      !name.includes("foto") &&
      !name.includes("proposta"),
  );
}

function pickUpdatedAt(resource: CkanResource, dataset: CkanPackage): string | null {
  return resource.last_modified ?? resource.metadata_modified ?? dataset.metadata_modified ?? resource.created ?? null;
}

async function fetchDataset(): Promise<{ dataset: CkanPackage; resource: CkanResource; source: CandidateSource }> {
  const response = await fetch(TSE_CKAN_PACKAGE_URL, {
    next: { revalidate: 60 * 60 },
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel consultar o catalogo oficial do TSE.");
  }

  const payload = (await response.json()) as CkanPackageResponse;
  const dataset = payload.result;
  const resource = dataset?.resources?.find(isCandidateResource);

  if (!payload.success || !dataset || !resource?.url) {
    throw new Error("O catalogo oficial do TSE nao retornou o recurso de candidatos esperado.");
  }

  return {
    dataset,
    resource,
    source: {
      datasetName: dataset.title ?? "Candidatos - 2026",
      datasetUrl: TSE_CANDIDATES_DATASET_URL,
      resourceName: resource.name ?? "Candidatos",
      resourceUrl: resource.url,
      updatedAt: pickUpdatedAt(resource, dataset),
    },
  };
}

function decodeCsvFromZip(buffer: ArrayBuffer): string {
  const files = unzipSync(new Uint8Array(buffer));
  const entries = Object.entries(files);
  const candidateEntry =
    entries.find(([name]) => /consulta_cand.*\.csv$/i.test(name)) ??
    entries.find(([name]) => name.toLocaleLowerCase("pt-BR").endsWith(".csv"));

  if (!candidateEntry) {
    throw new Error("O arquivo oficial do TSE nao contem um CSV de candidatos.");
  }

  return new TextDecoder("iso-8859-1").decode(candidateEntry[1]);
}

async function fetchCandidateCsv(resourceUrl: string): Promise<string> {
  const response = await fetch(resourceUrl, {
    next: { revalidate: 60 * 60 },
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel baixar o arquivo oficial de candidatos do TSE.");
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (resourceUrl.toLocaleLowerCase("pt-BR").endsWith(".zip") || contentType.includes("zip")) {
    return decodeCsvFromZip(await response.arrayBuffer());
  }

  return new TextDecoder("iso-8859-1").decode(await response.arrayBuffer());
}

export async function searchOfficialCandidates(filters: CandidateFilters): Promise<CandidateSearchResult> {
  const { source } = await fetchDataset();
  const csv = await fetchCandidateCsv(source.resourceUrl);
  const limit = Math.min(Math.max(filters.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
  const candidates = parseDelimited(csv)
    .map((record) => normalizeTseCandidate(record, source.updatedAt))
    .filter((candidate) => candidate !== null)
    .filter((candidate) => candidateMatchesFilters(candidate, filters));

  return {
    source,
    filters: {
      ...filters,
      uf: filters.uf?.toUpperCase(),
      limit,
    },
    total: candidates.length,
    candidates: candidates.slice(0, limit),
  };
}
