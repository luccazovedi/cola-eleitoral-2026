"use client";

import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { useMemo, useState } from "react";
import { brazilianStates, type BrazilianStateCode } from "@/lib/brazil";
import { electionFlow, type ElectionStepId } from "@/lib/project";

type DraftSelection = {
  candidateId: string | null;
};

const initialSelections = Object.fromEntries(
  electionFlow.map((step) => [step.id, { candidateId: null }]),
) as Record<ElectionStepId, DraftSelection>;

export function ElectionFlow() {
  const [uf, setUf] = useState<BrazilianStateCode | "">("");
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selections] = useState(initialSelections);
  const currentStep = electionFlow[currentIndex];
  const progress = useMemo(
    () => Math.round(((currentIndex + 1) / electionFlow.length) * 100),
    [currentIndex],
  );

  const canStart = uf.length === 2;
  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex < electionFlow.length - 1;

  return (
    <section id="fluxo" aria-labelledby="fluxo-title" className="grid gap-5 lg:grid-cols-[1fr_360px]">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-teal-700 text-white">
            <MapPin aria-hidden="true" className="size-5" />
          </span>
          <div>
            <h2 id="fluxo-title" className="text-2xl font-bold tracking-normal text-slate-950">
              Monte sua cola por UF e cargo
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              A UF e obrigatoria antes da busca. O fluxo preserva o progresso enquanto voce avanca e volta entre os cargos.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="grid gap-2 text-sm font-semibold text-slate-900" htmlFor="uf">
            UF do eleitor
            <select
              className="min-h-12 rounded-md border border-slate-300 bg-white px-3 text-base text-slate-950 shadow-sm"
              id="uf"
              onChange={(event) => {
                setUf(event.target.value as BrazilianStateCode | "");
                setStarted(false);
                setCurrentIndex(0);
              }}
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
        </div>

        {!started ? (
          <div className="mt-6 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950" role="status">
            Selecione a UF para liberar as etapas de cargos. Nenhuma escolha politica sera enviada para analytics.
          </div>
        ) : (
          <div className="mt-6 grid gap-5">
            <div aria-label={`Progresso: ${progress}%`} className="grid gap-2" role="group">
              <div className="flex items-center justify-between text-sm font-medium text-slate-700">
                <span>
                  Etapa {currentIndex + 1} de {electionFlow.length}
                </span>
                <span>{progress}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-teal-700" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <article className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold uppercase text-slate-600">{uf}</p>
              <h3 className="mt-2 text-2xl font-bold tracking-normal text-slate-950">{currentStep.label}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">{currentStep.helper}</p>
              <p className="mt-4 rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700">
                Selecao atual: {selections[currentStep.id].candidateId ?? "pendente"}
              </p>
            </article>

            <div className="grid grid-cols-2 gap-3">
              <button
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition enabled:hover:border-slate-500 disabled:cursor-not-allowed disabled:text-slate-400"
                disabled={!canGoBack}
                onClick={() => setCurrentIndex((index) => Math.max(index - 1, 0))}
                type="button"
              >
                <ChevronLeft aria-hidden="true" className="size-4" />
                Voltar
              </button>
              <button
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-teal-700 px-4 py-3 text-sm font-semibold text-white transition enabled:hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
                disabled={!canGoForward}
                onClick={() => setCurrentIndex((index) => Math.min(index + 1, electionFlow.length - 1))}
                type="button"
              >
                Avancar
                <ChevronRight aria-hidden="true" className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <aside aria-labelledby="ordem-title" className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 id="ordem-title" className="text-lg font-bold text-slate-950">
          Ordem dos cargos
        </h2>
        <ol className="mt-4 grid gap-2">
          {electionFlow.map((step, index) => {
            const isCurrent = started && index === currentIndex;
            return (
              <li key={step.id}>
                <button
                  aria-current={isCurrent ? "step" : undefined}
                  className="flex w-full items-center gap-3 rounded-md border border-slate-200 bg-white p-3 text-left text-sm transition hover:border-teal-700 disabled:cursor-not-allowed disabled:opacity-60 aria-[current=step]:border-teal-700 aria-[current=step]:bg-teal-50"
                  disabled={!started}
                  onClick={() => setCurrentIndex(index)}
                  type="button"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <span className="grid gap-1">
                    <span className="font-semibold text-slate-950">{step.label}</span>
                    {isCurrent ? <span className="text-xs font-medium text-teal-800">Etapa atual</span> : null}
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
