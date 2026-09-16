import { parseDelimited } from "@/lib/csv";
import { candidateMatchesFilters, normalizeTseCandidate } from "@/lib/tse/normalize";
import {
  decodeCandidateCsvFromZip,
  TSE_CANDIDATES_DATASET_URL,
  TSE_CANDIDATES_RESOURCE_URL,
} from "@/lib/tse/resources";
import type { Candidate, CandidateFilters, CandidateSearchResult, CandidateSource } from "@/types/candidate";

const TSE_CANDIDATES_DATASET_ID = "candidatos-2026";
const TSE_CKAN_PACKAGE_URL = `https://dadosabertos.tse.jus.br/api/3/action/package_show?id=${TSE_CANDIDATES_DATASET_ID}`;
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

function isCandidate(candidate: Candidate | null): candidate is Candidate {
  return candidate !== null;
}

async function fetchDataset(): Promise<{ dataset: CkanPackage; resource: CkanResource; source: CandidateSource }> {
  let response: Response | null = null;

  try {
    response = await fetch(TSE_CKAN_PACKAGE_URL, {
      headers: {
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (compatible; ColaEleitoral2026/1.0; +https://cola-eleitoral-2026-azure.vercel.app)",
      },
      next: { revalidate: 60 * 60 },
      signal: AbortSignal.timeout(8_000),
    });
  } catch {
    response = null;
  }

  if (!response?.ok) {
    const fallbackResource: CkanResource = {
      name: "Candidatos",
      format: "CSV",
      url: TSE_CANDIDATES_RESOURCE_URL,
    };
    const fallbackDataset: CkanPackage = { title: "Candidatos - 2026", resources: [fallbackResource] };

    return {
      dataset: fallbackDataset,
      resource: fallbackResource,
      source: {
        datasetName: "Candidatos - 2026",
        datasetUrl: TSE_CANDIDATES_DATASET_URL,
        resourceName: "Candidatos",
        resourceUrl: TSE_CANDIDATES_RESOURCE_URL,
        updatedAt: null,
      },
    };
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

async function fetchCandidateCsv(resourceUrl: string, uf?: string): Promise<string> {
  const response = await fetch(resourceUrl, {
    headers: {
      Accept: "application/zip,text/csv;q=0.9,*/*;q=0.8",
      Referer: TSE_CANDIDATES_DATASET_URL,
      "User-Agent":
        "Mozilla/5.0 (compatible; ColaEleitoral2026/1.0; +https://cola-eleitoral-2026-azure.vercel.app)",
    },
    next: { revalidate: 60 * 60 },
  });

  if (!response.ok) {
    throw new Error(`Nao foi possivel baixar o arquivo oficial de candidatos do TSE (${response.status}).`);
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (resourceUrl.toLocaleLowerCase("pt-BR").endsWith(".zip") || contentType.includes("zip")) {
    return decodeCandidateCsvFromZip(await response.arrayBuffer(), uf);
  }

  return new TextDecoder("iso-8859-1").decode(await response.arrayBuffer());
}

export async function searchOfficialCandidates(filters: CandidateFilters): Promise<CandidateSearchResult> {
  const { source } = await fetchDataset();
  const csv = await fetchCandidateCsv(source.resourceUrl, filters.uf);
  const limit = Math.min(Math.max(filters.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
  const candidates = parseDelimited(csv)
    .map((record) => normalizeTseCandidate(record, source.updatedAt))
    .filter(isCandidate)
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
