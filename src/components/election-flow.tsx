"use client";

import { CheckCircle2, ChevronLeft, ChevronRight, Download, Loader2, MapPin, Pencil, Printer, ReceiptText, Search, Trash2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { brazilianStates, type BrazilianStateCode } from "@/lib/brazil";
import { electionFlow, type ElectionStepId } from "@/lib/project";
import { searchCandidatesFromLocalMirror } from "@/lib/tse/client";
import { loadCandidatePhotoUrls } from "@/lib/tse/photos";
import type { Candidate, CandidateOffice, CandidateSearchResult } from "@/types/candidate";

type SelectionState = Record<ElectionStepId, Candidate | null>;

type CandidateAvatarProps = {
  candidate: Candidate;
  photoUrl?: string;
  size?: "sm" | "md";
};

type PersistedElectionState = {
  version: 1;
  uf: BrazilianStateCode | "";
  started: boolean;
  currentIndex: number;
  selections: SelectionState;
};

const initialSelections = Object.fromEntries(electionFlow.map((step) => [step.id, null])) as SelectionState;
const STORAGE_KEY = "cola-eleitoral-2026:progress";

const officeByStep: Record<ElectionStepId, CandidateOffice> = {
  "deputado-federal": "deputado-federal",
  "deputado-estadual-distrital": "deputado-estadual-distrital",
  "senador-1": "senador",
  "senador-2": "senador",
  governador: "governador",
  presidente: "presidente",
};

function candidateInitials(candidate: Candidate): string {
  return candidate.ballotName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function CandidateAvatar({ candidate, photoUrl, size = "md" }: CandidateAvatarProps) {
  const [failedPhotoUrl, setFailedPhotoUrl] = useState<string | undefined>();
  const sizeClass = size === "sm" ? "size-10" : "size-12 sm:size-14";
  const imageSize = size === "sm" ? "40px" : "(max-width: 639px) 48px, 56px";

  return (
    <span
      className={`candidate-avatar relative flex ${sizeClass} shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-200 text-xs font-black text-slate-700`}
    >
      {photoUrl && failedPhotoUrl !== photoUrl ? (
        <Image
          alt={`Foto de ${candidate.ballotName}`}
          className="object-cover"
          fill
          onError={() => setFailedPhotoUrl(photoUrl)}
          sizes={imageSize}
          src={photoUrl}
          unoptimized
        />
      ) : (
        <span aria-label={`Foto de ${candidate.ballotName} ainda não disponível`}>
          {candidateInitials(candidate)}
        </span>
      )}
    </span>
  );
}

function loadCanvasImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Não foi possível carregar a foto."));
    image.src = url;
  });
}

function formatUpdatedAt(value: string | null): string {
  if (!value) {
    return "data nao informada";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function readPersistedState(): PersistedElectionState | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (!value) {
      return null;
    }

    const parsed = JSON.parse(value) as Partial<PersistedElectionState>;
    if (parsed.version !== 1 || typeof parsed.uf !== "string" || typeof parsed.selections !== "object") {
      return null;
    }

    return {
      version: 1,
      uf: parsed.uf as BrazilianStateCode | "",
      started: Boolean(parsed.started),
      currentIndex: Math.min(Math.max(Number(parsed.currentIndex) || 0, 0), electionFlow.length - 1),
      selections: { ...initialSelections, ...parsed.selections },
    };
  } catch {
    return null;
  }
}

export function ElectionFlow() {
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const [uf, setUf] = useState<BrazilianStateCode | "">("");
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selections, setSelections] = useState<SelectionState>(initialSelections);
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [sourceUpdatedAt, setSourceUpdatedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [finalized, setFinalized] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  const currentStep = electionFlow[currentIndex];
  const currentOffice = officeByStep[currentStep.id];
  const selectedCandidate = selections[currentStep.id];
  const progress = useMemo(
    () => Math.round(((currentIndex + 1) / electionFlow.length) * 100),
    [currentIndex],
  );
  const selectedCount = Object.values(selections).filter(Boolean).length;
  const canStart = uf.length === 2;
  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex < electionFlow.length - 1;
  const isLastStep = currentIndex === electionFlow.length - 1;
  const selectedCandidates = useMemo(
    () => Object.values(selections).filter((candidate): candidate is Candidate => Boolean(candidate)),
    [selections],
  );

  useEffect(() => {
    if (started && !reviewing && !finalized) {
      stepHeadingRef.current?.focus();
    }
  }, [currentIndex, finalized, reviewing, started]);

  useEffect(() => {
    queueMicrotask(() => {
      const persisted = readPersistedState();
      if (persisted) {
        setUf(persisted.uf);
        setStarted(persisted.started && Boolean(persisted.uf));
        setCurrentIndex(persisted.currentIndex);
        setSelections(persisted.selections);
      }
      setStorageReady(true);
    });
  }, []);

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    const persisted: PersistedElectionState = {
      version: 1,
      uf,
      started,
      currentIndex,
      selections,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
  }, [currentIndex, selections, started, storageReady, uf]);

  useEffect(() => {
    if (!started || !uf) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      const params = new URLSearchParams({
        office: currentOffice,
        uf: currentOffice === "presidente" ? "BR" : uf,
        limit: "24",
      });

      if (query.trim()) {
        params.set("q", query.trim());
      }

      setIsLoading(true);
      setLoadError(null);

      try {
        const result: CandidateSearchResult = await searchCandidatesFromLocalMirror({
          office: currentOffice,
          uf: currentOffice === "presidente" ? "BR" : uf,
          q: params.get("q") || undefined,
          limit: 24,
        });

        if (controller.signal.aborted) {
          return;
        }

        setCandidates(result.candidates);
        setSourceUpdatedAt(result.source.updatedAt);
      } catch (error) {
        if (!controller.signal.aborted) {
          setCandidates([]);
          setSourceUpdatedAt(null);
          setLoadError(error instanceof Error ? error.message : "Nao foi possivel buscar candidatos.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [currentOffice, query, started, uf]);

  useEffect(() => {
    if (!started || candidates.length === 0) {
      return;
    }

    let active = true;
    const photoUf = currentOffice === "presidente" ? "BR" : uf;

    void loadCandidatePhotoUrls(
      photoUf,
      candidates.map((candidate) => candidate.id),
    ).then((urls) => {
      if (active) {
        setPhotoUrls((current) => ({ ...current, ...urls }));
      }
    });

    return () => {
      active = false;
    };
  }, [candidates, currentOffice, started, uf]);

  useEffect(() => {
    if (selectedCandidates.length === 0) {
      return;
    }

    let active = true;
    const candidatesByUf = new Map<string, Candidate[]>();

    for (const candidate of selectedCandidates) {
      const group = candidatesByUf.get(candidate.uf) ?? [];
      group.push(candidate);
      candidatesByUf.set(candidate.uf, group);
    }

    void Promise.all(
      Array.from(candidatesByUf, ([candidateUf, groupedCandidates]) =>
        loadCandidatePhotoUrls(candidateUf, groupedCandidates.map((candidate) => candidate.id)),
      ),
    ).then((results) => {
      if (active) {
        setPhotoUrls((current) => Object.assign({}, current, ...results));
      }
    });

    return () => {
      active = false;
    };
  }, [selectedCandidates]);

  function selectCandidate(candidate: Candidate) {
    if (currentStep.id === "senador-2" && selections["senador-1"]?.id === candidate.id) {
      setLoadError("Escolha outro candidato para a segunda vaga ao Senado.");
      return;
    }

    if (currentStep.id === "senador-1" && selections["senador-2"]?.id === candidate.id) {
      setLoadError("Este candidato ja esta na segunda escolha ao Senado.");
      return;
    }

    setLoadError(null);
    setFinalized(false);
    setSelections((current) => ({
      ...current,
      [currentStep.id]: candidate,
    }));
  }

  function resetFlow(nextUf: BrazilianStateCode | "") {
    setUf(nextUf);
    setStarted(false);
    setCurrentIndex(0);
    setSelections(initialSelections);
    setPhotoUrls({});
    setQuery("");
    setReviewing(false);
    setFinalized(false);
  }

  function clearSavedProgress() {
    window.localStorage.removeItem(STORAGE_KEY);
    setUf("");
    setStarted(false);
    setCurrentIndex(0);
    setSelections(initialSelections);
    setCandidates([]);
    setPhotoUrls({});
    setSourceUpdatedAt(null);
    setLoadError(null);
    setQuery("");
    setReviewing(false);
    setFinalized(false);
  }

  function editSelection(stepId: ElectionStepId) {
    const stepIndex = electionFlow.findIndex((step) => step.id === stepId);
    setCurrentIndex(Math.max(stepIndex, 0));
    setQuery("");
    setReviewing(false);
    setFinalized(false);
  }

  function finalizeChoices() {
    const missingCount = electionFlow.filter((step) => !selections[step.id]).length;

    if (
      missingCount > 0 &&
      !window.confirm(
        `Ainda existem ${missingCount} cargo(s) sem candidato selecionado. Deseja finalizar a cola incompleta?`,
      )
    ) {
      return;
    }

    setReviewing(false);
    setFinalized(true);
  }

  async function exportReceiptAsImage() {
    try {
      const width = 720;
      const rowHeight = 84;
      const height = 280 + electionFlow.length * rowHeight;
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = width * scale;
      canvas.height = height * scale;
      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Canvas indisponível");
      }

      context.scale(scale, scale);
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
      context.fillStyle = "#0f172a";
      context.textAlign = "center";
      context.font = "700 22px Arial, sans-serif";
      context.fillText("COLA ELEITORAL 2026", width / 2, 48);
      context.font = "900 34px Arial, sans-serif";
      context.fillText(uf, width / 2, 88);
      context.fillStyle = "#475569";
      context.font = "16px Arial, sans-serif";
      context.fillText("Sem validade oficial. Não é comprovante de voto.", width / 2, 118);
      context.strokeStyle = "#94a3b8";
      context.setLineDash([8, 8]);
      context.beginPath();
      context.moveTo(40, 146);
      context.lineTo(width - 40, 146);
      context.stroke();
      context.setLineDash([]);

      for (const [index, step] of electionFlow.entries()) {
        const candidate = selections[step.id];
        const y = 188 + index * rowHeight;
        const photoUrl = candidate ? photoUrls[candidate.id] : undefined;
        const textX = photoUrl ? 116 : 48;

        if (photoUrl) {
          try {
            const candidateImage = await loadCanvasImage(photoUrl);
            context.drawImage(candidateImage, 48, y - 18, 52, 52);
          } catch {
            // O texto continua disponível como fallback quando a foto falha.
          }
        }

        context.textAlign = "left";
        context.fillStyle = "#0f172a";
        context.font = "700 18px Arial, sans-serif";
        context.fillText(step.label, textX, y);
        context.fillStyle = "#475569";
        context.font = "16px Arial, sans-serif";
        context.fillText(candidate?.ballotName ?? "Pendente", textX, y + 26);
        context.textAlign = "right";
        context.fillStyle = "#0f172a";
        context.font = "900 30px monospace";
        context.fillText(candidate?.number ?? "--", width - 48, y + 12);
      }

      const footerY = 190 + electionFlow.length * rowHeight;
      context.strokeStyle = "#94a3b8";
      context.setLineDash([8, 8]);
      context.beginPath();
      context.moveTo(40, footerY);
      context.lineTo(width - 40, footerY);
      context.stroke();
      context.setLineDash([]);
      context.textAlign = "center";
      context.fillStyle = "#475569";
      context.font = "14px Arial, sans-serif";
      context.fillText("Fonte: dados oficiais do TSE · Escolhas mantidas no dispositivo", width / 2, footerY + 34);

      canvas.toBlob((blob) => {
        if (!blob) {
          setExportMessage("Não foi possível gerar a imagem neste navegador.");
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = `cola-eleitoral-2026-${uf}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        setExportMessage("Imagem salva no dispositivo.");
      }, "image/png");
    } catch {
      setExportMessage("A exportação como imagem não é suportada neste navegador.");
    }
  }

  return (
    <section id="fluxo" aria-labelledby="fluxo-title" className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        {finalized ? (
          <div className="receipt-stage mb-6" aria-live="polite">
            <div className="receipt-cutter">corte aqui</div>
            <article className="receipt-paper" aria-label="Cola eleitoral gerada">
              <div className="text-center">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Cola Eleitoral 2026</p>
                <h2 className="mt-1 text-xl font-black tracking-normal text-slate-950">{uf}</h2>
                <p className="mt-1 text-xs text-slate-600">Sem validade oficial. Não é comprovante de voto.</p>
              </div>
              <div className="my-4 border-t border-dashed border-slate-400" />
              <ol className="grid gap-3">
                {electionFlow.map((step) => {
                  const candidate = selections[step.id];
                  return (
                    <li key={step.id} className="grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 text-sm">
                      {candidate ? (
                        <CandidateAvatar candidate={candidate} photoUrl={photoUrls[candidate.id]} size="sm" />
                      ) : (
                        <span aria-hidden="true" className="flex size-10 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-400">—</span>
                      )}
                      <span className="min-w-0">
                        <strong className="block text-slate-950">{step.label}</strong>
                        <span className="block truncate text-slate-600">{candidate?.ballotName ?? "Pendente"}</span>
                      </span>
                      <strong className="font-mono text-lg text-slate-950">{candidate?.number ?? "--"}</strong>
                    </li>
                  );
                })}
              </ol>
              <div className="my-4 border-t border-dashed border-slate-400" />
              <p className="text-xs leading-5 text-slate-600">
                Fonte: dados oficiais do TSE. Atualização: {formatUpdatedAt(sourceUpdatedAt)}. Escolhas mantidas no dispositivo.
              </p>
            </article>
            <div className="no-print mx-auto mt-4 grid w-full max-w-[340px] grid-cols-2 gap-3">
              <button
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-white px-3 py-3 text-sm font-bold text-slate-950 shadow-sm hover:bg-slate-100"
                onClick={() => window.print()}
                type="button"
              >
                <Printer aria-hidden="true" className="size-4" />
                Imprimir
              </button>
              <button
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-teal-700 px-3 py-3 text-sm font-bold text-white shadow-sm hover:bg-teal-800"
                onClick={() => void exportReceiptAsImage()}
                type="button"
              >
                <Download aria-hidden="true" className="size-4" />
                Salvar imagem
              </button>
            </div>
            {exportMessage ? (
              <p className="no-print mt-3 text-center text-sm font-semibold text-white" role="status">
                {exportMessage}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-teal-700 text-white">
            <MapPin aria-hidden="true" className="size-5" />
          </span>
          <div>
            <h2 id="fluxo-title" className="text-2xl font-bold tracking-normal text-slate-950">
              Monte sua cola por UF e cargo
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Pesquise candidatos oficiais por nome, número ou partido. Suas escolhas ficam apenas neste navegador.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <label className="grid gap-2 text-sm font-semibold text-slate-900" htmlFor="uf">
            UF do eleitor
            <select
              className="min-h-12 rounded-md border border-slate-300 bg-white px-3 text-base text-slate-950 shadow-sm"
              id="uf"
              onChange={(event) => resetFlow(event.target.value as BrazilianStateCode | "")}
              value={uf}
            >
              <option value="">Selecione uma UF</option>
              {brazilianStates.map((state) => (
                <option key={state.value} value={state.value}>
                  {state.value} - {state.label}
                </option>
              ))}
            </select>
          </label>

          <button
            className="min-h-12 rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition enabled:hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
            disabled={!canStart}
            onClick={() => setStarted(true)}
            type="button"
          >
            Iniciar fluxo
          </button>
          <button
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:border-rose-500 hover:text-rose-800 disabled:cursor-not-allowed disabled:text-slate-400"
            disabled={!uf && selectedCount === 0}
            onClick={clearSavedProgress}
            type="button"
          >
            <Trash2 aria-hidden="true" className="size-4" />
            Limpar escolhas
          </button>
        </div>

        {storageReady && (uf || selectedCount > 0) ? (
          <p className="mt-3 text-xs font-medium text-slate-600" role="status">
            Progresso salvo somente neste navegador.
          </p>
        ) : null}

        {!started ? (
          <div className="mt-6 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950" role="status">
            Selecione a UF para liberar as etapas de cargos. Nenhuma escolha política será enviada para analytics.
          </div>
        ) : reviewing ? (
          <section className="mt-6 grid gap-5" aria-labelledby="review-title">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-teal-800">Revisão</p>
              <h3 id="review-title" className="mt-1 text-2xl font-bold text-slate-950">
                Confira suas escolhas
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                Revise número, nome e partido. Você pode alterar qualquer cargo antes de gerar a cola.
              </p>
            </div>

            <ol className="grid gap-3">
              {electionFlow.map((step) => {
                const candidate = selections[step.id];
                return (
                  <li className="review-card rounded-lg border border-slate-200 bg-slate-50 p-3 sm:p-4" key={step.id}>
                    <div className="grid grid-cols-[48px_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[56px_minmax(0,1fr)_auto]">
                      {candidate ? (
                        <CandidateAvatar candidate={candidate} photoUrl={photoUrls[candidate.id]} />
                      ) : (
                        <span aria-hidden="true" className="flex size-12 items-center justify-center rounded-lg bg-slate-200 text-sm font-bold text-slate-500 sm:size-14">—</span>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-950">{step.label}</p>
                        {candidate ? (
                          <p className="mt-1 text-sm leading-6 text-slate-700">
                            <strong className="font-mono text-base text-slate-950">{candidate.number}</strong>
                            {` — ${candidate.ballotName} · ${candidate.party || "Partido não informado"}`}
                          </p>
                        ) : (
                          <p className="mt-1 text-sm font-semibold text-amber-800">Escolha pendente</p>
                        )}
                      </div>
                      <button
                        className="col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 transition hover:border-teal-700 sm:col-auto"
                        onClick={() => editSelection(step.id)}
                        type="button"
                      >
                        <Pencil aria-hidden="true" className="size-4" />
                        Alterar
                      </button>
                    </div>
                  </li>
                );
              })}
            </ol>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:border-slate-500"
                onClick={() => setReviewing(false)}
                type="button"
              >
                <ChevronLeft aria-hidden="true" className="size-4" />
                Voltar às escolhas
              </button>
              <button
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-teal-700 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-800"
                onClick={finalizeChoices}
                type="button"
              >
                <CheckCircle2 aria-hidden="true" className="size-4" />
                Finalizar cola
              </button>
            </div>
          </section>
        ) : (
          <div className="step-panel mt-6 grid gap-5" key={currentStep.id}>
            <div
              aria-label={`Etapa ${currentIndex + 1} de ${electionFlow.length}`}
              aria-valuemax={electionFlow.length}
              aria-valuemin={1}
              aria-valuenow={currentIndex + 1}
              className="grid gap-2"
              role="progressbar"
            >
              <div className="flex items-center justify-between text-sm font-medium text-slate-700">
                <span>
                  Etapa {currentIndex + 1} de {electionFlow.length}
                </span>
                <span>{progress}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                <div className="progress-fill h-full rounded-full bg-teal-700" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold uppercase text-slate-600">{currentOffice === "presidente" ? "BR" : uf}</p>
              <h3
                className="mt-2 text-2xl font-bold tracking-normal text-slate-950 outline-none"
                ref={stepHeadingRef}
                tabIndex={-1}
              >
                {currentStep.label}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">{currentStep.helper}</p>
              <p className="mt-4 rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700">
                Seleção atual: {selectedCandidate ? `${selectedCandidate.number} - ${selectedCandidate.ballotName}` : "pendente"}
              </p>
            </article>

            <label className="grid gap-2 text-sm font-semibold text-slate-900" htmlFor="candidate-search">
              Buscar candidato
              <div className="relative">
                <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                <input
                  className="min-h-12 w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 text-base text-slate-950 shadow-sm"
                  id="candidate-search"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Nome, número ou partido"
                  type="search"
                  value={query}
                />
              </div>
            </label>

            {loadError ? (
              <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950" role="status">
                {loadError}
              </div>
            ) : null}

            <div aria-busy={isLoading} aria-label="Resultados da busca" className="grid gap-3" role="region">
              {isLoading ? (
                <div className="flex min-h-24 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white text-sm font-semibold text-slate-700">
                  <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                  Carregando candidatos oficiais
                </div>
              ) : null}

              {!isLoading && candidates.length === 0 ? (
                <div className="rounded-md border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
                  Nenhum candidato encontrado para este filtro. Tente nome, numero ou partido.
                </div>
              ) : null}

              {!isLoading && candidates.map((candidate, index) => {
                const isSelected = selectedCandidate?.id === candidate.id;
                const isSenateConflict =
                  (currentStep.id === "senador-2" && selections["senador-1"]?.id === candidate.id) ||
                  (currentStep.id === "senador-1" && selections["senador-2"]?.id === candidate.id);
                return (
                  <button
                    aria-disabled={isSenateConflict}
                    aria-pressed={isSelected}
                    className="candidate-card grid min-h-20 grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-65 aria-pressed:border-teal-700 aria-pressed:bg-teal-50 sm:min-h-24 sm:grid-cols-[56px_minmax(0,1fr)_auto]"
                    disabled={isSenateConflict}
                    key={candidate.id}
                    onClick={() => selectCandidate(candidate)}
                    style={{ animationDelay: `${Math.min(index, 8) * 35}ms` }}
                    type="button"
                  >
                    <CandidateAvatar candidate={candidate} photoUrl={photoUrls[candidate.id]} />
                    <span className="min-w-0">
                      <strong className="block truncate text-base text-slate-950">{candidate.ballotName}</strong>
                      <span className="block text-sm text-slate-600">{candidate.fullName}</span>
                      <span className="block text-sm font-semibold text-slate-700">{candidate.party || "Partido nao informado"}</span>
                      {isSenateConflict ? (
                        <span className="mt-1 block text-xs font-bold text-amber-800">
                          Já escolhido para a outra vaga ao Senado
                        </span>
                      ) : null}
                      {isSelected ? (
                        <span className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-teal-800">
                          <CheckCircle2 aria-hidden="true" className="size-4" />
                          Selecionado
                        </span>
                      ) : null}
                    </span>
                    <strong className="font-mono text-xl text-slate-950 sm:text-2xl">{candidate.number}</strong>
                  </button>
                );
              })}
            </div>

            <div className="mobile-actions sticky bottom-2 z-10 grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-white/95 p-2 shadow-lg backdrop-blur sm:static sm:gap-3 sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
              <button
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition enabled:hover:border-slate-500 disabled:cursor-not-allowed disabled:text-slate-400"
                disabled={!canGoBack}
                onClick={() => {
                  setCurrentIndex((index) => Math.max(index - 1, 0));
                  setQuery("");
                }}
                type="button"
              >
                <ChevronLeft aria-hidden="true" className="size-4" />
                Voltar
              </button>
              {isLastStep ? (
                <button
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-teal-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-800"
                  onClick={() => setReviewing(true)}
                  type="button"
                >
                  <ReceiptText aria-hidden="true" className="size-4" />
                  Revisar escolhas
                </button>
              ) : (
                <button
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-teal-700 px-4 py-3 text-sm font-semibold text-white transition enabled:hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
                  disabled={!canGoForward}
                  onClick={() => {
                    setCurrentIndex((index) => Math.min(index + 1, electionFlow.length - 1));
                    setQuery("");
                  }}
                  type="button"
                >
                  Avançar
                  <ChevronRight aria-hidden="true" className="size-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <aside aria-labelledby="ordem-title" className="hidden rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:block">
        <h2 id="ordem-title" className="text-lg font-bold text-slate-950">
          Ordem dos cargos
        </h2>
        <p className="mt-1 text-sm text-slate-600">{selectedCount} de {electionFlow.length} cargos selecionados</p>
        <ol className="mt-4 grid gap-2">
          {electionFlow.map((step, index) => {
            const isCurrent = started && index === currentIndex;
            const candidate = selections[step.id];
            return (
              <li key={step.id}>
                <button
                  aria-current={isCurrent ? "step" : undefined}
                  className="flex w-full items-center gap-3 rounded-md border border-slate-200 bg-white p-3 text-left text-sm transition hover:border-teal-700 disabled:cursor-not-allowed disabled:opacity-60 aria-[current=step]:border-teal-700 aria-[current=step]:bg-teal-50"
                  disabled={!started}
                  onClick={() => {
                    setCurrentIndex(index);
                    setQuery("");
                  }}
                  type="button"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <span className="grid gap-1">
                    <span className="font-semibold text-slate-950">{step.label}</span>
                    <span className="text-xs font-medium text-slate-600">
                      {candidate ? `${candidate.number} - ${candidate.ballotName}` : isCurrent ? "Etapa atual" : "Pendente"}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </aside>
    </section>
  );
}
