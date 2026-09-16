import { unzipSync } from "fflate";

const archiveCache = new Map<string, Promise<Record<string, Uint8Array<ArrayBuffer>>>>();
const photoUrlCache = new Map<string, string>();

function photoArchiveUrl(uf: string): string {
  return `https://cdn.tse.jus.br/estatistica/sead/eleicoes/eleicoes2026/fotos/foto_cand2026_${uf}_div.zip`;
}

async function loadPhotoArchive(uf: string): Promise<Record<string, Uint8Array<ArrayBuffer>>> {
  const normalizedUf = uf.toUpperCase();
  const cached = archiveCache.get(normalizedUf);

  if (cached) {
    return cached;
  }

  const request = fetch(photoArchiveUrl(normalizedUf))
    .then((response) => {
      if (!response.ok) {
        throw new Error(`O arquivo de fotos do TSE não respondeu (${response.status}).`);
      }
      return response.arrayBuffer();
    })
    .then((buffer) => unzipSync(new Uint8Array(buffer)) as Record<string, Uint8Array<ArrayBuffer>>);

  archiveCache.set(normalizedUf, request);
  return request;
}

export async function loadCandidatePhotoUrls(uf: string, candidateIds: string[]): Promise<Record<string, string>> {
  const normalizedUf = uf.toUpperCase();
  const result: Record<string, string> = {};

  try {
    const files = await loadPhotoArchive(normalizedUf);
    const entries = Object.entries(files);

    for (const candidateId of candidateIds) {
      const cacheKey = `${normalizedUf}:${candidateId}`;
      const cachedUrl = photoUrlCache.get(cacheKey);

      if (cachedUrl) {
        result[candidateId] = cachedUrl;
        continue;
      }

      const expectedName = `F${normalizedUf}${candidateId}_div.jpg`.toUpperCase();
      const photo = entries.find(([name]) => name.toUpperCase().endsWith(expectedName))?.[1];

      if (photo) {
        const url = URL.createObjectURL(new Blob([photo], { type: "image/jpeg" }));
        photoUrlCache.set(cacheKey, url);
        result[candidateId] = url;
      }
    }
  } catch {
    return {};
  }

  return result;
}
