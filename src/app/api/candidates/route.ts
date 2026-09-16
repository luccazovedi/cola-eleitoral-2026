import { NextResponse } from "next/server";
import { candidateMatchesFilters } from "@/lib/tse/normalize";
import type { Candidate, CandidateOffice, CandidateSearchResult } from "@/types/candidate";

const offices = new Set<CandidateOffice>([
  "deputado-federal",
  "deputado-estadual-distrital",
  "senador",
  "governador",
  "presidente",
]);

export const dynamic = "force-dynamic";

type CandidateTuple = [string, CandidateOffice, string, string, string, string, string];
type CandidateMirror = { updatedAt: string | null; candidates: CandidateTuple[] };

function parseOffice(value: string | null): CandidateOffice | undefined {
  if (!value) {
    return undefined;
  }

  return offices.has(value as CandidateOffice) ? (value as CandidateOffice) : undefined;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const uf = searchParams.get("uf")?.trim().toUpperCase();
  const office = parseOffice(searchParams.get("office"));
  const q = searchParams.get("q")?.trim();
  const limit = Number(searchParams.get("limit") ?? undefined);
  const normalizedLimit = Math.min(Math.max(Number.isFinite(limit) ? limit : 100, 1), 200);
  const dataUf = office === "presidente" ? "BR" : uf;

  if (!dataUf) {
    return NextResponse.json({ error: "Informe uma UF válida." }, { status: 400 });
  }

  try {
    const mirrorResponse = await fetch(new URL(`/data/candidates/${dataUf}.json`, request.url), {
      cache: "force-cache",
    });
    if (!mirrorResponse.ok) {
      throw new Error(`Espelho local indisponível (${mirrorResponse.status}).`);
    }

    const mirror = (await mirrorResponse.json()) as CandidateMirror;
    const filters = { uf: dataUf, office, q: q || undefined, limit: normalizedLimit };
    const candidates: Candidate[] = mirror.candidates.map(
      ([id, candidateOffice, number, ballotName, fullName, party, status]) => ({
        id,
        uf: dataUf,
        office: candidateOffice,
        officeLabel: candidateOffice,
        number,
        ballotName,
        fullName,
        party,
        status,
        sourceUpdatedAt: mirror.updatedAt,
      }),
    );
    const matches = candidates.filter((candidate) => candidateMatchesFilters(candidate, filters));
    const result: CandidateSearchResult = {
      source: {
        datasetName: "Candidatos - 2026",
        datasetUrl: "https://dadosabertos.tse.jus.br/dataset/candidatos-2026",
        resourceName: "Espelho versionado do arquivo oficial de candidatos",
        resourceUrl: "https://cdn.tse.jus.br/estatistica/sead/odsele/consulta_cand/consulta_cand_2026.zip",
        updatedAt: mirror.updatedAt,
      },
      filters,
      total: matches.length,
      candidates: matches.slice(0, normalizedLimit),
    };

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Nao foi possivel carregar os candidatos oficiais do TSE.",
        detail: error instanceof Error ? error.message : "Erro desconhecido.",
      },
      { status: 503 },
    );
  }
}
