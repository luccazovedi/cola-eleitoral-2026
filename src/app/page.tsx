import { CheckCircle2, ExternalLink, LockKeyhole, ShieldCheck } from "lucide-react";
import { ElectionFlow } from "@/components/election-flow";
import { officialSources, privacyPrinciples } from "@/lib/project";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <a className="skip-link" href="#fluxo">
        Ir para a seleção de candidatos
      </a>
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-5 border-b border-slate-200 pb-6">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-teal-700/25 bg-white px-3 py-1 text-sm font-medium text-teal-900">
            <ShieldCheck aria-hidden="true" className="size-4" />
            MVP independente e neutro
          </div>

          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-bold tracking-normal text-slate-950 sm:text-5xl">
                Cola Eleitoral 2026
              </h1>
              <p className="mt-4 text-base leading-7 text-slate-700 sm:text-lg">
                Monte uma cola eleitoral pessoal com dados oficiais do TSE, sem voto online, sem recomendação política e sem registrar escolhas em backend ou analytics.
              </p>
            </div>
            <a
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
              href="#fluxo"
            >
              Começar
            </a>
          </div>
        </header>

        <ElectionFlow />

        <section aria-labelledby="principios" className="grid gap-3 sm:grid-cols-3">
          <h2 id="principios" className="sr-only">
            Princípios do produto
          </h2>
          {privacyPrinciples.map((principle) => (
            <article key={principle} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <LockKeyhole aria-hidden="true" className="mb-3 size-5 text-teal-700" />
              <p className="text-sm font-semibold leading-6 text-slate-900">{principle}</p>
            </article>
          ))}
        </section>

        <aside aria-labelledby="fontes-title" className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 id="fontes-title" className="text-lg font-bold text-slate-950">
            Fontes oficiais
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Os candidatos são exibidos de forma neutra, sem recomendação ou ranqueamento. A origem e a data da última atualização ficam visíveis.
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-3">
            {officialSources.map((source) => (
              <li key={source.href}>
                <a
                  className="group flex h-full items-start gap-2 rounded-md border border-slate-200 p-3 text-sm font-medium text-slate-900 transition hover:border-teal-700 hover:text-teal-800"
                  href={source.href}
                  rel="noreferrer"
                  target="_blank"
                >
                  <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-teal-700" />
                  <span className="flex-1">{source.label}</span>
                  <ExternalLink aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-slate-500 group-hover:text-teal-800" />
                </a>
              </li>
            ))}
          </ul>
        </aside>

        <footer className="border-t border-slate-200 py-5 text-sm leading-6 text-slate-600">
          Este projeto é independente, não possui vínculo oficial com a Justiça Eleitoral e não emite comprovante de voto.
        </footer>
      </section>
    </main>
  );
}
