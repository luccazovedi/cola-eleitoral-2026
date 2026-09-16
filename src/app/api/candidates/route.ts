import { NextResponse } from "next/server";
import { searchOfficialCandidates } from "@/lib/tse/candidates";
import type { CandidateOffice } from "@/types/candidate";

const offices = new Set<CandidateOffice>([
  "deputado-federal",
  "deputado-estadual-distrital",
  "senador",
  "governador",
  "presidente",
]);

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

  try {
    const result = await searchOfficialCandidates({
      uf: uf || undefined,
      office,
      q: q || undefined,
      limit: Number.isFinite(limit) ? limit : undefined,
    });

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
      { status: 502 },
    );
  }
}
